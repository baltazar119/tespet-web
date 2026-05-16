"""
Tespet Hasar Analiz Motoru
xView2 dataseti üzerine fine-tune edilmiş ResNet50 tabanlı model.

Kullanım:
  python damage_analyzer.py --image path/to/image.jpg
  python damage_analyzer.py --image path/to/image.jpg --model checkpoints/best.pth
"""
import argparse
import json
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import transforms, models
from PIL import Image

# xView2 hasar seviyeleri
DAMAGE_CLASSES = ["no-damage", "minor-damage", "major-damage", "destroyed"]
DAMAGE_TO_SCORE = {"no-damage": 5, "minor-damage": 30, "major-damage": 68, "destroyed": 92}
DAMAGE_TO_CATEGORY = {
    "no-damage": "none",
    "minor-damage": "minor",
    "major-damage": "severe",
    "destroyed": "total"
}
DAMAGE_TO_PRIORITY = {
    "no-damage": "low",
    "minor-damage": "medium",
    "major-damage": "high",
    "destroyed": "critical"
}

TRANSFORM = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def build_model(num_classes: int = 4, pretrained: bool = True) -> nn.Module:
    """xView2 fine-tune için ResNet50 tabanlı model."""
    model = models.resnet50(weights=models.ResNet50_Weights.DEFAULT if pretrained else None)
    # Son katmanı değiştir
    in_features = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 256),
        nn.ReLU(),
        nn.Dropout(p=0.2),
        nn.Linear(256, num_classes),
    )
    return model


def load_model(checkpoint_path: str | None = None) -> nn.Module:
    model = build_model(pretrained=checkpoint_path is None)
    if checkpoint_path and Path(checkpoint_path).exists():
        state = torch.load(checkpoint_path, map_location="cpu")
        model.load_state_dict(state.get("model_state_dict", state))
        print(f"Model yüklendi: {checkpoint_path}")
    else:
        print("Checkpoint bulunamadı — pretrained ImageNet ağırlıkları kullanılıyor (demo mod)")
    model.eval()
    return model


def predict_image(image_path: str, model: nn.Module) -> dict:
    """Tek görüntü üzerinde hasar tahmini yap."""
    img = Image.open(image_path).convert("RGB")
    tensor = TRANSFORM(img).unsqueeze(0)

    with torch.no_grad():
        logits = model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
        pred_idx = probs.argmax().item()

    pred_class = DAMAGE_CLASSES[pred_idx]
    confidence = round(probs[pred_idx].item() * 100, 1)

    return {
        "predicted_class": pred_class,
        "damage_score": DAMAGE_TO_SCORE[pred_class],
        "damage_category": DAMAGE_TO_CATEGORY[pred_class],
        "priority_level": DAMAGE_TO_PRIORITY[pred_class],
        "confidence": confidence,
        "class_probabilities": {
            cls: round(probs[i].item() * 100, 2)
            for i, cls in enumerate(DAMAGE_CLASSES)
        },
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tespet Hasar Analiz")
    parser.add_argument("--image", required=True, help="Analiz edilecek görüntü yolu")
    parser.add_argument("--model", default=None, help="Model checkpoint (.pth)")
    args = parser.parse_args()

    model = load_model(args.model)
    result = predict_image(args.image, model)

    print(json.dumps(result, ensure_ascii=False, indent=2))
