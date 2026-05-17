# Tespet — AI-Destekli Sigorta Hasar Tespit Platformu

> **Tema Kodları:** A5 · B1 · C3 · C7 · D1 · D3 · D9

**Tespet**, afet sonrası sigorta hasar tespitini yapay zeka ile otomatikleştiren bir SaaS platformdur. Uydu görüntüsü analizi, AI hasar skorlaması ve otomatik hasar kaydı oluşturma özellikleriyle sigorta şirketlerinin saha ekibi maliyetlerini ve işlem sürelerini dramatik biçimde düşürmeyi hedefler.

🔗 **Live Demo:** [tespet-web.vercel.app](https://tespet-web.vercel.app/login)  
📖 **API Docs:** [localhost:8000/docs](http://localhost:8000/docs) (local)

---

## İçindekiler

- [Proje Amacı](#-proje-amacı)
- [Özellikler](#-özellikler)
- [Ekran Görüntüleri](#-ekran-görüntüleri)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Kurulum](#-kurulum)
- [Ortam Değişkenleri](#-ortam-değişkenleri)
- [Demo Giriş Bilgileri](#-demo-giriş-bilgileri)
- [API Referansı](#-api-referansı)
- [Proje Mimarisi](#-proje-mimarisi)
- [Ekip](#-ekip)

---

## 🎯 Proje Amacı

Türkiye'de büyük afetlerin ardından sigorta şirketleri binlerce hasarlı mülkü manuel olarak incelemek zorunda kalır. Bu süreç haftalar sürer, saha ekibi maliyetleri yüksektir ve poliçe sahipleri uzun bekleyişlerle karşılaşır.

**Tespet** bu sorunu üç adımda çözer:

1. **Uydu görüntüsü analizi** — Esri World Imagery üzerinden afet bölgesindeki her mülkün uydu fotoğrafı çekilir
2. **Çift model skorlaması** — xView2 fine-tuned ResNet50 (%70) + NVIDIA Llama 3.2 90B Vision (%30) birleşik hasar skoru üretir
3. **Otomatik hasar kaydı** — Skor ≥ 30 olan mülkler için ekspertiz raporu ve hasar kaydı otomatik oluşturulur; sigorta şirketi yalnızca onay/ret kararı verir

---

## ✨ Özellikler

### Sigorta Şirketi Paneli
- **Afet Haritası** — Aktif afetlerin coğrafi ve ısı haritası görünümü
- **Paralel Uydu Analizi** — Tüm etkilenen poliçeler `asyncio.gather` ile eş zamanlı analiz edilir
- **Poliçe Konum Pinleri** — Harita üzerinde hasar skoruna göre renklenen (kırmızı/turuncu/sarı/yeşil) pin işaretçileri
- **Otomatik Hasar Kaydı** — Yapay zeka tarafından oluşturulan Türkçe ekspertiz raporuyla birlikte
- **Hasar Yönetimi** — Onaylama, reddetme, PDF rapor indirme
- **Analitik Dashboard** — Hasar dağılımı, ortalama işlem süresi, saha ekibi tasarruf tahminleri

### Müşteri Paneli
- Poliçe görüntüleme
- Hasar başvurusu oluşturma (fotoğraf yükleme, konum seçimi)
- Başvuru durumu takibi
- PDF ekspertiz raporu indirme

### AI Altyapısı
| Bileşen | Açıklama |
|---------|----------|
| xView2 ResNet50 | xView2 veri seti üzerinde fine-tuned, val_acc=0.830 |
| NVIDIA Llama 3.2 90B Vision | `build.nvidia.com` API — uydu görüntüsü VLM analizi |
| Nemotron Nano 9B | OpenRouter — Türkçe ekspertiz raporu üretimi |
| Brev GPU (350$) | xView2 fine-tuning için A100 eğitim ortamı |

---

## 📸 Ekran Görüntüleri

### Giriş & Ana Sayfa
![Landing](screenshots/01-landing.png)

### Sigortacı Paneli — Aktif Afetler & Uydu Analizi
![Afet Haritası](screenshots/02-disaster-map.png)

### Sigortacı Paneli — Hasar Kayıtları
![Hasar Kayıtları](screenshots/03-claims-list.png)

### Sigortacı Paneli — Profil & Güvenlik
![Profil](screenshots/04-profile.png) ![Güvenlik](screenshots/05-security.png)

### Müşteri Paneli — Poliçelerim
![Poliçelerim](screenshots/07-customer-policies.png)

### Müşteri Paneli — Hasar Kayıtlarım
![Hasar Kayıtlarım](screenshots/08-customer-claims.png)

### Müşteri Paneli — Hasar Başvuru Formu
![Hasar Formu 1](screenshots/09-claim-form-1.png)
![Hasar Formu 2](screenshots/10-claim-form-2.png)

---

## 🛠 Teknoloji Yığını

### Frontend
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| Next.js | 14 (App Router) | React framework |
| TypeScript | 5 | Tip güvenliği |
| Tailwind CSS | 3 | Stil |
| react-leaflet | 4 | İnteraktif harita |
| Lucide React | — | İkon seti |

### Backend
| Teknoloji | Versiyon | Kullanım |
|-----------|----------|----------|
| FastAPI | 0.115 | REST API |
| SQLAlchemy | 2 | ORM |
| SQLite / PostgreSQL | — | Veritabanı (local/prod) |
| fpdf2 | 2.7.9 | PDF rapor üretimi |
| PyTorch + torchvision | 2 | xView2 model inference |
| httpx | — | Async HTTP (uydu görüntüsü) |

### Altyapı
| Servis | Amaç |
|--------|------|
| Vercel | Frontend deploy |
| Render | Backend deploy |
| Supabase | PostgreSQL (production) |
| Esri World Imagery | Uydu fotoğrafı API |

---

## 🚀 Kurulum

### Gereksinimler
- Python 3.11+
- Node.js 18+
- Git

### 1. Repoyu klonla

```bash
git clone https://github.com/baltazar119/tespet-web.git
cd tespet-web
```

### 2. Backend

```bash
cd backend

# Sanal ortam oluştur ve aktifleştir
python -m venv venv
venv\Scripts\activate          # Windows
source venv/bin/activate       # macOS / Linux

# Bağımlılıkları yükle
pip install -r requirements.txt

# Ortam değişkenlerini yapılandır
cp .env.example .env
# .env dosyasını düzenle (aşağıya bakın)

# Demo verisini yükle (kullanıcılar, poliçeler, afetler)
python seed_data.py

# Sunucuyu başlat
uvicorn app.main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 3. Frontend

```bash
cd frontend

npm install

cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

### 4. AI Modeli (opsiyonel)

xView2 fine-tuned modeli olmadan sistem mock değerler üretir. Gerçek model için:

```bash
# Hugging Face'ten modeli indir (HF_TOKEN gerektirir)
python -c "
from huggingface_hub import hf_hub_download
hf_hub_download(repo_id='REPO_ID', filename='best.pth', local_dir='backend/models/')
"
```

---

## 🔑 Ortam Değişkenleri

### `backend/.env`

```env
# ── Yapay Zeka API'leri ──────────────────────────────────────
# NVIDIA build.nvidia.com — Llama 3.2 90B Vision (uydu analizi)
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx

# OpenRouter — Nemotron Nano 9B (ekspertiz raporu)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxx

# Hugging Face — xView2 model ağırlıkları
HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxx
HF_REPO_ID=kullaniciadi/tespet-xview2

# ── Güvenlik ─────────────────────────────────────────────────
JWT_SECRET_KEY=guclu-rastgele-bir-anahtar-buraya

# ── Veritabanı ───────────────────────────────────────────────
# Lokal geliştirme
DATABASE_URL=sqlite:///./tespet.db

# Production (Supabase)
# DATABASE_URL=postgresql://postgres:SIFRE@db.PROJE.supabase.co:5432/postgres
```

> ⚠️ **Önemli:** API anahtarları olmadan sistem otomatik olarak mock moda geçer. Demo için tüm özellikler mock verilerle çalışır.

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Production'da Render backend URL'si ile değiştirin.

---

## 👤 Demo Giriş Bilgileri

| Rol | E-posta | Şifre |
|-----|---------|-------|
| Sigorta Şirketi (Anadolu) | demo@anadolusigorta.com | demo1234 |
| Sigorta Şirketi (Allianz) | demo@allianz.com.tr | demo1234 |
| Müşteri | ahmet.celik@gmail.com | demo1234 |
| Müşteri | fatma.yildiz@gmail.com | demo1234 |
| Müşteri | mehmet.yilmaz@gmail.com | demo1234 |

### Demo Akışı

**Afet Analizi Senaryosu (Sigorta Şirketi):**
1. `demo@anadolusigorta.com` ile giriş yap
2. **Aktif Afetler** sayfasına git
3. Kahramanmaraş Depremi kartında **Uydu Analizi** butonuna bas
4. Sistem etkilenen tüm poliçeleri paralel olarak analiz eder (~15 sn)
5. Harita üzerinde hasarlı mülkler renklenir; hasar kaydları otomatik oluşur
6. **Hasar Kayıtları** sayfasından onaylama veya reddetme işlemi yap

**Müşteri Başvurusu Senaryosu:**
1. `ahmet.celik@gmail.com` ile giriş yap
2. **Hasar Başvurusu Oluştur** — fotoğraf ve konum ekle
3. AI anında hasar skorlaması yapar
4. Sigorta şirketi panelinde başvuru görünür

---

## 📡 API Referansı

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
PATCH  /auth/profile

GET    /policies/
GET    /policies/{id}

GET    /claims/                        ?status= &priority_level= &disaster_type=
POST   /claims/                        multipart/form-data (fotoğraf yükleme)
GET    /claims/{id}
POST   /claims/{id}/approve
POST   /claims/{id}/reject
GET    /claims/{id}/report.pdf
GET    /claims/{id}/satellite.jpg

GET    /disasters/                     ?status=
GET    /disasters/{id}
GET    /disasters/{id}/affected-policies
POST   /disasters/{id}/analyze         ← paralel uydu + AI analizi

GET    /analytics/summary

GET    /health
```

Tam Swagger dokümantasyonu: `http://localhost:8000/docs`

---

## 🗂 Proje Mimarisi

```
tespet-web/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── policy.py
│   │   │   ├── claim.py
│   │   │   └── disaster.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── policies.py
│   │   │   ├── claims.py
│   │   │   ├── disasters.py      ← asyncio.gather paralel analiz
│   │   │   └── analytics.py
│   │   ├── services/
│   │   │   ├── nvidia_service.py ← Llama 3.2 90B Vision + Nemotron
│   │   │   ├── satellite_service.py ← Esri uydu görüntüsü
│   │   │   ├── xview2_service.py    ← ResNet50 inference
│   │   │   ├── geo_service.py       ← Haversine + poliçe eşleştirme
│   │   │   └── pdf_service.py       ← fpdf2 rapor üretimi
│   │   └── schemas/
│   ├── models/
│   │   └── best.pth              ← xView2 fine-tuned ağırlıklar
│   ├── seed_data.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── login/
│   │   ├── register/
│   │   ├── customer/
│   │   │   ├── policies/
│   │   │   └── claims/
│   │   └── insurer/
│   │       ├── disasters/        ← afet haritası + uydu analizi
│   │       ├── claims/           ← hasar yönetimi
│   │       ├── analytics/
│   │       └── profile/
│   ├── components/
│   │   └── DisasterMap.tsx       ← react-leaflet + poliçe pinleri
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── .env.local.example
└── ai/
    ├── damage_analyzer.py        ← eğitim sonrası analiz scripti
    └── train_xview2.py           ← xView2 fine-tuning (Brev A100)
```

### Hasar Skoru Hesaplama

```
combined_score = xView2_score × 0.70 + VLM_score × 0.30

Skor Aralıkları:
  < 30   → Yeşil  (Hasar Yok)      → Hasar kaydı açılmaz
  30–54  → Sarı   (Hafif Hasar)    → Otomatik hasar kaydı
  55–84  → Turuncu (Orta-Ağır)    → Yüksek öncelik
  ≥ 85   → Kırmızı (Yıkık/Total)  → Kritik öncelik
```

---

## 👥 Ekip

| İsim | Rol |
|------|-----|
| **Abdulgazi ŞİMŞEK** | İş Geliştirme & Model Eğitimi |
| **Ömer Yılmaz** | Backend Geliştirme |
| **Ömer Faruk Araboğa** | Frontend Geliştirme |

---

## 📄 Lisans

Bu proje akademik/yarışma amaçlı geliştirilmiştir.
