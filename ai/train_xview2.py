"""
xView2 Dataseti Üzerinde Fine-Tuning Scripti
============================================
Bu script Brev GPU instance'ında çalıştırılmak üzere tasarlanmıştır.

Ön koşullar:
  pip install torch torchvision tqdm scikit-learn

xView2 veri indirme:
  1. https://xview2.org adresinden kayıt ol
  2. Train dataseti indir (tier1_images.tar.gz, tier1_labels.tar.gz)
  3. Şu yapıya yerleştir:
     data/xview2/
       train/images/     (pre/post .png dosyaları)
       train/labels/     (building_*.json etiket dosyaları)

Kullanım (Brev L4 GPU'da):
  python train_xview2.py --data-dir data/xview2 --epochs 10 --batch 32
"""
import argparse
import json
import os
import time
from pathlib import Path

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from tqdm import tqdm
from sklearn.metrics import classification_report, confusion_matrix

from damage_analyzer import build_model, DAMAGE_CLASSES

LABEL_MAP = {
    "no-damage": 0,
    "minor-damage": 1,
    "major-damage": 2,
    "destroyed": 3,
    "un-classified": None,  # atla
}

TRAIN_TRANSFORM = transforms.Compose([
    transforms.RandomResizedCrop(224, scale=(0.7, 1.0)),
    transforms.RandomHorizontalFlip(),
    transforms.RandomVerticalFlip(),
    transforms.ColorJitter(brightness=0.3, contrast=0.3, saturation=0.2),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])

VAL_TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
])


class XView2Dataset(Dataset):
    """xView2 post-disaster crop dataset."""

    def __init__(self, data_dir: Path, split: str = "train", transform=None, max_samples: int = None):
        self.transform = transform
        self.samples = []

        label_dir = data_dir / split / "labels"
        image_dir = data_dir / split / "images"

        for label_file in sorted(label_dir.glob("*.json"))[:max_samples or 999999]:
            if "post" not in label_file.name:
                continue
            img_file = image_dir / label_file.name.replace(".json", ".png")
            if not img_file.exists():
                continue

            with open(label_file) as f:
                data = json.load(f)

            for feature in data.get("features", {}).get("xy", []):
                props = feature.get("properties", {})
                damage = props.get("subtype", "no-damage")
                label = LABEL_MAP.get(damage)
                if label is None:
                    continue
                coords = feature.get("wkt", "")
                self.samples.append({
                    "image_path": img_file,
                    "label": label,
                    "damage": damage,
                })

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        s = self.samples[idx]
        img = Image.open(s["image_path"]).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, s["label"]


def train_epoch(model, loader, optimizer, criterion, device):
    model.train()
    total_loss, correct, total = 0, 0, 0
    for imgs, labels in tqdm(loader, desc="Train", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        optimizer.zero_grad()
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        total_loss += loss.item()
        correct += (outputs.argmax(1) == labels).sum().item()
        total += len(labels)
    return total_loss / len(loader), correct / total


@torch.no_grad()
def eval_epoch(model, loader, criterion, device):
    model.eval()
    total_loss, correct, total = 0, 0, 0
    all_preds, all_labels = [], []
    for imgs, labels in tqdm(loader, desc="Val  ", leave=False):
        imgs, labels = imgs.to(device), labels.to(device)
        outputs = model(imgs)
        loss = criterion(outputs, labels)
        total_loss += loss.item()
        preds = outputs.argmax(1)
        correct += (preds == labels).sum().item()
        total += len(labels)
        all_preds.extend(preds.cpu().tolist())
        all_labels.extend(labels.cpu().tolist())
    return total_loss / len(loader), correct / total, all_preds, all_labels


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--data-dir", default="data/xview2", type=Path)
    parser.add_argument("--epochs", default=10, type=int)
    parser.add_argument("--batch", default=32, type=int)
    parser.add_argument("--lr", default=1e-4, type=float)
    parser.add_argument("--max-samples", default=None, type=int, help="Hızlı test için örnek sınırı")
    parser.add_argument("--output", default="checkpoints", type=Path)
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Device: {device}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")

    args.output.mkdir(parents=True, exist_ok=True)

    # Dataset
    train_ds = XView2Dataset(args.data_dir, "train", TRAIN_TRANSFORM, args.max_samples)
    # xView2'nin test split'ini val olarak kullan
    val_dir = args.data_dir / "test"
    if not val_dir.exists():
        val_dir = args.data_dir / "train"

    val_ds = XView2Dataset(args.data_dir, val_dir.name, VAL_TRANSFORM, args.max_samples)

    print(f"Train: {len(train_ds)} örnek | Val: {len(val_ds)} örnek")

    # Sınıf ağırlıkları — xView2 imbalanced (no-damage baskın)
    class_counts = [0] * 4
    for s in train_ds.samples:
        class_counts[s["label"]] += 1
    weights = [1.0 / (c + 1) for c in class_counts]
    class_weights = torch.tensor(weights, dtype=torch.float).to(device)

    train_loader = DataLoader(train_ds, batch_size=args.batch, shuffle=True, num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch, shuffle=False, num_workers=4, pin_memory=True)

    model = build_model(pretrained=True).to(device)

    # Transfer learning: ilk aşamada sadece son katmanlar eğitilir
    for name, param in model.named_parameters():
        if "fc" not in name and "layer4" not in name:
            param.requires_grad = False

    optimizer = torch.optim.AdamW(filter(lambda p: p.requires_grad, model.parameters()), lr=args.lr)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)
    criterion = nn.CrossEntropyLoss(weight=class_weights)

    best_acc = 0.0
    history = []

    for epoch in range(1, args.epochs + 1):
        t0 = time.time()

        # Epoch 4'ten itibaren tüm parametreler açılır
        if epoch == 4:
            for param in model.parameters():
                param.requires_grad = True
            optimizer = torch.optim.AdamW(model.parameters(), lr=args.lr / 5)

        train_loss, train_acc = train_epoch(model, train_loader, optimizer, criterion, device)
        val_loss, val_acc, preds, labels = eval_epoch(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - t0
        print(f"Epoch {epoch:02d}/{args.epochs} | "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.3f} | "
              f"Val Loss: {val_loss:.4f} Acc: {val_acc:.3f} | {elapsed:.0f}s")

        history.append({
            "epoch": epoch, "train_loss": train_loss, "train_acc": train_acc,
            "val_loss": val_loss, "val_acc": val_acc
        })

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "val_acc": val_acc,
                "train_acc": train_acc,
                "class_names": DAMAGE_CLASSES,
            }, args.output / "best.pth")
            print(f"  ✓ En iyi model kaydedildi (val_acc={val_acc:.3f})")

    # Final rapor
    print("\nKlasifikasyon Raporu:")
    print(classification_report(labels, preds, target_names=DAMAGE_CLASSES))

    with open(args.output / "training_history.json", "w") as f:
        json.dump(history, f, indent=2)

    print(f"\nEğitim tamamlandı. En iyi val accuracy: {best_acc:.3f}")
    print(f"Model kaydedildi: {args.output}/best.pth")


if __name__ == "__main__":
    main()
