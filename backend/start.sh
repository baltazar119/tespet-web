#!/bin/bash
set -e

echo "==> Veritabanı seed ediliyor..."
python seed_data.py

echo "==> Sunucu başlatılıyor..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
