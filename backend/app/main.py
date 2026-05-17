from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.database import engine, Base
from app.models import *  # register all models
from app.routers import auth, policies, claims, disasters, analytics

app = FastAPI(
    title="Tespet API",
    description="AI-destekli sigorta hasar tespit platformu",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yüklenen görseller için static mount
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Uydu görüntüsü cache
cache_dir = Path("../data/satellite_cache")
if cache_dir.exists():
    app.mount("/satellite", StaticFiles(directory=str(cache_dir)), name="satellite")

app.include_router(auth.router)
app.include_router(policies.router)
app.include_router(claims.router)
app.include_router(disasters.router)
app.include_router(analytics.router)


@app.on_event("startup")
def startup():
    try:
        Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"[DB] Tablo olusturma hatasi (devam ediliyor): {e}")
        return
    # Eksik kolonları ekle (migration)
    migrations = [
        "ALTER TABLE claims ADD COLUMN IF NOT EXISTS satellite_image_path VARCHAR",
    ]
    try:
        with engine.connect() as conn:
            for sql in migrations:
                try:
                    conn.execute(__import__("sqlalchemy").text(sql))
                except Exception:
                    pass
            conn.commit()
    except Exception as e:
        print(f"[DB] Migration hatasi (devam ediliyor): {e}")


@app.get("/health")
def health():
    return {"status": "ok", "service": "tespet-api"}
