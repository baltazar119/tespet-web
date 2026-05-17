#!/bin/bash
set -e

echo "=== Tespet API Baslatiliyor ==="

# xView2 modelini Hugging Face'den indir (yoksa)
if [ -n "$HF_TOKEN" ] && [ -n "$HF_REPO_ID" ]; then
    MODEL_PATH="models/best.pth"
    if [ ! -f "$MODEL_PATH" ]; then
        echo "[1/3] xView2 modeli indiriliyor: $HF_REPO_ID"
        mkdir -p models
        python -c "
from huggingface_hub import hf_hub_download
import shutil
path = hf_hub_download(
    repo_id='$HF_REPO_ID',
    filename='best.pth',
    token='$HF_TOKEN'
)
shutil.copy(path, 'models/best.pth')
print('[xView2] Model indirildi.')
"
    else
        echo "[1/3] xView2 modeli zaten mevcut, atlanıyor"
    fi
else
    echo "[1/3] HF_TOKEN veya HF_REPO_ID tanimlanmamis — xView2 mock modda calisacak"
fi

# Demo verisi yukle
echo "[2/3] Demo verisi yukleniyor..."
python seed_data.py

# API'yi baslat
echo "[3/3] API baslatiliyor: port ${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
