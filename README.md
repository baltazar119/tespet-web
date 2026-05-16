# Tespet

**AI-destekli afet sonrası sigorta hasar tespit platformu**

Tema Kodları: **A5 + B1 + C3 + C7 + D1 + D3 + D9**

---

## Kurulum

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp .env.example .env           # API key'leri doldurun
python seed_data.py            # Demo verisini yükle
uvicorn app.main:app --reload  # http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev                    # http://localhost:3000
```

---

## Demo Giriş Bilgileri

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Sigorta Şirketi | demo@anadolusigorta.com | demo1234 |
| Sigorta Şirketi | demo@allianz.com.tr | demo1234 |
| Müşteri | ahmet.celik@gmail.com | demo1234 |
| Müşteri | fatma.yildiz@gmail.com | demo1234 |

---

## Mimari

```
tespet/
├── backend/          FastAPI mikroservis
│   ├── app/
│   │   ├── routers/  auth, policies, claims, disasters, analytics
│   │   ├── services/ nvidia_service, satellite_service, geo_service
│   │   └── models/   SQLAlchemy ORM
│   └── seed_data.py
├── frontend/         Next.js 14 + Tailwind
│   └── app/
│       ├── login/
│       ├── customer/ (poliçeler, hasar formu)
│       └── insurer/  (afetler, kayıtlar, detay, analitik)
└── ai/
    ├── damage_analyzer.py   ResNet50 hasar sınıflandırıcı
    └── train_xview2.py      xView2 fine-tuning scripti
```

## NVIDIA Altyapısı

| Servis | Kullanım |
|--------|----------|
| `build.nvidia.com` | Llama 3.2 90B Vision — görüntü analizi |
| OpenRouter | Nemotron Nano 9B — ekspertiz raporu yazımı |
| Brev GPU (350$) | xView2 üzerinde ResNet50 fine-tuning |

## API Endpoint'leri

```
POST /auth/login
GET  /auth/me
GET  /policies/
GET  /claims/                  ?status= &priority_level= &disaster_type=
POST /claims/                  (multipart/form-data)
POST /claims/{id}/approve
POST /claims/{id}/reject
GET  /disasters/
GET  /disasters/{id}/affected-policies
GET  /analytics/summary
GET  /health
```

API docs: http://localhost:8000/docs
