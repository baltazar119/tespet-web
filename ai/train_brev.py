"""
xView2 Building Damage Classification — Brev A100
Calistir: python train_brev.py
"""
import os, json, warnings
import numpy as np
from pathlib import Path
from tqdm import tqdm

import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader, random_split
from torchvision import models, transforms
from PIL import Image
import rasterio
from shapely import wkt as shapely_wkt

warnings.filterwarnings("ignore")

# ── CONFIG ────────────────────────────────────────────────────────────────────
DATA_DIR   = Path("geotiffs/hold")
PATCH_DIR  = Path("patches")
MODEL_PATH = Path("best.pth")
PATCH_SIZE = 128
BATCH_SIZE = 64
EPOCHS     = 10
LR         = 1e-4
DEVICE     = "cuda" if torch.cuda.is_available() else "cpu"

CLASS_MAP = {
    "no-damage":    0,
    "minor-damage": 1,
    "major-damage": 2,
    "destroyed":    3,
}

print(f"Device: {DEVICE}")

# ── STEP 1: PATCH EXTRACTION ──────────────────────────────────────────────────
def extract_patches():
    label_dir = DATA_DIR / "labels"
    image_dir = DATA_DIR / "images"
    counts = {0: 0, 1: 0, 2: 0, 3: 0}

    json_files = sorted(label_dir.glob("*_post_disaster.json"))
    print(f"Found {len(json_files)} post-disaster label files")

    for json_path in tqdm(json_files, desc="Extracting patches"):
        with open(json_path) as f:
            data = json.load(f)

        stem     = json_path.stem
        tif_path = image_dir / (stem + ".tif")
        if not tif_path.exists():
            continue

        try:
            with rasterio.open(tif_path) as src:
                arr = src.read()          # (bands, H, W)
                h, w = arr.shape[1], arr.shape[2]

            # RGB: ilk 3 band (veya tek band tekrar)
            if arr.shape[0] >= 3:
                rgb = arr[:3].astype(np.float32)
            else:
                rgb = np.repeat(arr[:1], 3, axis=0).astype(np.float32)

            # Percentile normalize → 0-255
            for i in range(3):
                lo, hi = np.percentile(rgb[i], [2, 98])
                rgb[i] = np.clip((rgb[i] - lo) / (hi - lo + 1e-8) * 255, 0, 255)
            img = Image.fromarray(rgb.transpose(1, 2, 0).astype(np.uint8))

        except Exception:
            continue

        for feat in data.get("features", {}).get("xy", []):
            subtype = feat.get("properties", {}).get("subtype", "")
            if subtype not in CLASS_MAP:
                continue
            label = CLASS_MAP[subtype]

            try:
                geom   = shapely_wkt.loads(feat["wkt"])
                minx, miny, maxx, maxy = geom.bounds
                pad = 16
                x0 = max(0, int(minx) - pad)
                y0 = max(0, int(miny) - pad)
                x1 = min(w,  int(maxx) + pad)
                y1 = min(h,  int(maxy) + pad)

                if x1 - x0 < 8 or y1 - y0 < 8:
                    continue

                patch = img.crop((x0, y0, x1, y1))
                patch = patch.resize((PATCH_SIZE, PATCH_SIZE), Image.BILINEAR)

                out_dir = PATCH_DIR / str(label)
                out_dir.mkdir(parents=True, exist_ok=True)
                patch.save(out_dir / f"{stem}_{x0}_{y0}.jpg", quality=85)
                counts[label] += 1

            except Exception:
                continue

    print(f"Patches: no-damage={counts[0]}, minor={counts[1]}, major={counts[2]}, destroyed={counts[3]}")
    return counts


# ── STEP 2: DATASET ───────────────────────────────────────────────────────────
class PatchDataset(Dataset):
    def __init__(self, root, transform=None):
        self.samples   = []
        self.transform = transform
        for lbl in range(4):
            for p in (Path(root) / str(lbl)).glob("*.jpg"):
                self.samples.append((str(p), lbl))

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        img = Image.open(path).convert("RGB")
        if self.transform:
            img = self.transform(img)
        return img, label


# ── STEP 3: TRAIN ─────────────────────────────────────────────────────────────
def train():
    train_tf = transforms.Compose([
        transforms.RandomHorizontalFlip(),
        transforms.RandomVerticalFlip(),
        transforms.ColorJitter(0.2, 0.2, 0.2),
        transforms.RandomRotation(15),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225]),
    ])

    full_ds = PatchDataset(PATCH_DIR, transform=train_tf)
    n       = len(full_ds)
    if n < 20:
        print("HATA: Yeterli patch yok, veri kontrolü yap.")
        return

    n_val   = max(1, int(n * 0.15))
    n_train = n - n_val
    train_ds, val_ds = random_split(full_ds, [n_train, n_val])
    val_ds.dataset.transform = val_tf

    # Sınıf ağırlıkları (dengesiz veri için)
    all_labels  = [s[1] for s in full_ds.samples]
    class_cnt   = [all_labels.count(i) for i in range(4)]
    total       = sum(class_cnt)
    weights     = torch.FloatTensor([total / (c + 1) for c in class_cnt]).to(DEVICE)

    train_loader = DataLoader(train_ds, batch_size=BATCH_SIZE, shuffle=True,  num_workers=4, pin_memory=True)
    val_loader   = DataLoader(val_ds,   batch_size=BATCH_SIZE, shuffle=False, num_workers=4, pin_memory=True)

    # Model
    model    = models.resnet50(weights="IMAGENET1K_V2")
    model.fc = nn.Sequential(nn.Dropout(0.3), nn.Linear(2048, 4))
    model    = model.to(DEVICE)

    # Phase 1: sadece fc + layer4
    for p in model.parameters():       p.requires_grad = False
    for p in model.fc.parameters():    p.requires_grad = True
    for p in model.layer4.parameters(): p.requires_grad = True

    criterion = nn.CrossEntropyLoss(weight=weights)
    optimizer = torch.optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=LR)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=EPOCHS)

    best_acc = 0.0
    for epoch in range(EPOCHS):
        # Phase 2: epoch 4'ten itibaren tüm ağ
        if epoch == 4:
            for p in model.parameters(): p.requires_grad = True
            optimizer = torch.optim.Adam(model.parameters(), lr=LR * 0.1)

        model.train()
        t_loss, t_correct, t_total = 0, 0, 0
        for imgs, lbls in tqdm(train_loader, desc=f"Epoch {epoch+1}/{EPOCHS} train", leave=False):
            imgs, lbls = imgs.to(DEVICE), lbls.to(DEVICE)
            optimizer.zero_grad()
            out  = model(imgs)
            loss = criterion(out, lbls)
            loss.backward()
            optimizer.step()
            t_loss    += loss.item()
            t_correct += (out.argmax(1) == lbls).sum().item()
            t_total   += len(lbls)

        model.eval()
        v_correct, v_total = 0, 0
        with torch.no_grad():
            for imgs, lbls in val_loader:
                imgs, lbls = imgs.to(DEVICE), lbls.to(DEVICE)
                out = model(imgs)
                v_correct += (out.argmax(1) == lbls).sum().item()
                v_total   += len(lbls)

        val_acc = v_correct / v_total if v_total else 0
        print(f"Epoch {epoch+1:2d}/{EPOCHS} | Loss: {t_loss/len(train_loader):.3f} "
              f"| Train: {t_correct/t_total:.3f} | Val: {val_acc:.3f}")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save({
                "epoch":            epoch,
                "model_state_dict": model.state_dict(),
                "val_acc":          val_acc,
                "class_map":        CLASS_MAP,
            }, MODEL_PATH)
            print(f"  ✓ best.pth kaydedildi (val_acc={val_acc:.3f})")

        scheduler.step()

    print(f"\nEğitim tamamlandı. En iyi val accuracy: {best_acc:.3f}")
    print(f"Model: {MODEL_PATH}")


# ── MAIN ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not any(PATCH_DIR.glob("*/*.jpg")):
        print("=== Patch extraction başlıyor ===")
        extract_patches()
    else:
        total = sum(len(list((PATCH_DIR / str(i)).glob("*.jpg"))) for i in range(4))
        print(f"Mevcut patch'ler kullanılıyor: {total} adet")

    print("\n=== Eğitim başlıyor ===")
    train()
