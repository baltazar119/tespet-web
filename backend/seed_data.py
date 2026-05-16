"""
Demo veritabanını gerçekçi Türkiye verileriyle doldur.
Çalıştır: python seed_data.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta, timezone
from app.database import engine, SessionLocal, Base
from app.models import User, Policy, Claim, Disaster
from app.models.user import UserRole
from app.models.policy import PolicyType, PolicyStatus
from app.models.claim import ClaimStatus, DamageCategory, PriorityLevel
from app.models.disaster import DisasterType, DisasterStatus
from passlib.context import CryptContext

Base.metadata.create_all(bind=engine)
pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
db = SessionLocal()


def clear():
    db.query(Claim).delete()
    db.query(Policy).delete()
    db.query(Disaster).delete()
    db.query(User).delete()
    db.commit()


def run():
    clear()

    # ── SİGORTA ŞİRKETLERİ ────────────────────────────────────────────────
    anadolu = User(
        email="demo@anadolusigorta.com",
        full_name="Mehmet Yılmaz",
        hashed_password=pwd.hash("demo1234"),
        role=UserRole.insurer,
        company_name="Anadolu Sigorta A.Ş.",
        phone="+90 212 444 0 260",
    )
    allianz = User(
        email="demo@allianz.com.tr",
        full_name="Ayşe Kaya",
        hashed_password=pwd.hash("demo1234"),
        role=UserRole.insurer,
        company_name="Allianz Sigorta A.Ş.",
        phone="+90 212 444 0 300",
    )
    db.add_all([anadolu, allianz])
    db.flush()

    # ── MÜŞTERİLER ───────────────────────────────────────────────────────
    customers = [
        User(email="ahmet.celik@gmail.com",  full_name="Ahmet Çelik",    hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 533 111 2233"),
        User(email="fatma.yildiz@gmail.com", full_name="Fatma Yıldız",   hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 542 222 3344"),
        User(email="hasan.ozturk@gmail.com", full_name="Hasan Öztürk",   hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 505 333 4455"),
        User(email="zeynep.sahin@gmail.com", full_name="Zeynep Şahin",   hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 555 444 5566"),
        User(email="ali.demir@gmail.com",    full_name="Ali Demir",       hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 535 555 6677"),
        User(email="elif.arslan@gmail.com",  full_name="Elif Arslan",     hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 545 666 7788"),
        User(email="murat.koc@gmail.com",    full_name="Murat Koç",       hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 525 777 8899"),
    ]
    db.add_all(customers)
    db.flush()
    c = customers  # shorthand

    # ── AKTİF AFETLER ────────────────────────────────────────────────────
    dep_kahramanmaras = Disaster(
        name="Kahramanmaraş Depremi",
        disaster_type=DisasterType.deprem,
        status=DisasterStatus.active,
        center_lat=37.57, center_lon=36.93,
        radius_km=120,
        city="Kahramanmaraş", district="Merkez",
        magnitude=7.8,
        severity_score=92,
        satellite_damage_score=87,
        affected_buildings_estimate=15420,
        description="6 Şubat 2023 tarihli Kahramanmaraş merkezli deprem serisi.",
        source="AFAD",
        occurred_at=datetime(2023, 2, 6, 4, 17, tzinfo=timezone.utc),
    )
    sel_kastamonu = Disaster(
        name="Kastamonu Sel Felaketi",
        disaster_type=DisasterType.sel,
        status=DisasterStatus.active,
        center_lat=41.38, center_lon=33.78,
        radius_km=60,
        city="Kastamonu", district="Bozkurt",
        severity_score=74,
        satellite_damage_score=68,
        affected_buildings_estimate=3200,
        description="Sinop ve Kastamonu'yu etkileyen sel felaketi.",
        source="AFAD",
        occurred_at=datetime(2021, 8, 11, tzinfo=timezone.utc),
    )
    yangin_mugla = Disaster(
        name="Muğla Orman Yangını",
        disaster_type=DisasterType.yangin,
        status=DisasterStatus.monitoring,
        center_lat=37.11, center_lon=28.35,
        radius_km=40,
        city="Muğla", district="Bodrum",
        severity_score=65,
        satellite_damage_score=71,
        affected_buildings_estimate=820,
        description="Ege kıyılarını etkileyen orman yangını.",
        source="OGM",
        occurred_at=datetime(2021, 7, 28, tzinfo=timezone.utc),
    )
    dolu_konya = Disaster(
        name="Konya Dolu Yağışı",
        disaster_type=DisasterType.dolu,
        status=DisasterStatus.closed,
        center_lat=37.88, center_lon=32.49,
        radius_km=30,
        city="Konya", district="Selçuklu",
        severity_score=42,
        satellite_damage_score=38,
        affected_buildings_estimate=1100,
        source="MGM",
        occurred_at=datetime(2024, 5, 15, tzinfo=timezone.utc),
    )
    db.add_all([dep_kahramanmaras, sel_kastamonu, yangin_mugla, dolu_konya])
    db.flush()

    # ── POLİÇELER ────────────────────────────────────────────────────────
    policies = [
        Policy(policy_number="ANS-2023-00142", customer_id=c[0].id, insurer_id=anadolu.id,
               policy_type=PolicyType.deprem, status=PolicyStatus.active,
               property_address="Atatürk Cad. No:45 D:3", property_city="Kahramanmaraş",
               property_district="Merkez", property_lat=37.58, property_lon=36.94,
               property_area_m2=95, coverage_amount=2_500_000, premium_amount=4_800,
               start_date="2023-01-01", end_date="2024-01-01"),

        Policy(policy_number="ANS-2023-00287", customer_id=c[1].id, insurer_id=anadolu.id,
               policy_type=PolicyType.sel, status=PolicyStatus.active,
               property_address="Cumhuriyet Mah. Bozkurt Cd. No:12", property_city="Kastamonu",
               property_district="Bozkurt", property_lat=41.95, property_lon=34.01,
               property_area_m2=120, coverage_amount=1_800_000, premium_amount=3_200,
               start_date="2022-06-01", end_date="2023-06-01"),

        Policy(policy_number="ANS-2024-00391", customer_id=c[2].id, insurer_id=anadolu.id,
               policy_type=PolicyType.yangin, status=PolicyStatus.active,
               property_address="Kıyı Mah. Sahil Blv. No:7", property_city="Muğla",
               property_district="Bodrum", property_lat=37.03, property_lon=27.43,
               property_area_m2=180, coverage_amount=4_200_000, premium_amount=7_500,
               start_date="2024-01-01", end_date="2025-01-01"),

        Policy(policy_number="ANS-2024-00458", customer_id=c[3].id, insurer_id=anadolu.id,
               policy_type=PolicyType.tarim, status=PolicyStatus.active,
               property_address="Havzan Köyü Tarım Parseli", property_city="Konya",
               property_district="Selçuklu", property_lat=37.92, property_lon=32.52,
               property_area_m2=25000, coverage_amount=850_000, premium_amount=2_100,
               start_date="2024-04-01", end_date="2025-04-01"),

        Policy(policy_number="ALZ-2023-00821", customer_id=c[4].id, insurer_id=allianz.id,
               policy_type=PolicyType.konut, status=PolicyStatus.active,
               property_address="Bağcılar Mah. No:33 D:8", property_city="İstanbul",
               property_district="Bağcılar", property_lat=41.04, property_lon=28.86,
               property_area_m2=110, coverage_amount=3_500_000, premium_amount=6_200,
               start_date="2023-09-01", end_date="2024-09-01"),

        Policy(policy_number="ALZ-2024-01023", customer_id=c[5].id, insurer_id=allianz.id,
               policy_type=PolicyType.deprem, status=PolicyStatus.active,
               property_address="Karşıyaka Mah. İzmir Cd. No:88", property_city="İzmir",
               property_district="Karşıyaka", property_lat=38.46, property_lon=27.11,
               property_area_m2=75, coverage_amount=1_900_000, premium_amount=3_800,
               start_date="2024-03-01", end_date="2025-03-01"),

        Policy(policy_number="ANS-2024-00512", customer_id=c[6].id, insurer_id=anadolu.id,
               policy_type=PolicyType.dolu, status=PolicyStatus.expired,
               property_address="Akköy Tarım Arazisi", property_city="Konya",
               property_district="Karatay", property_lat=37.86, property_lon=32.61,
               property_area_m2=15000, coverage_amount=420_000, premium_amount=980,
               start_date="2023-04-01", end_date="2024-04-01"),
    ]
    db.add_all(policies)
    db.flush()
    p = policies

    # ── HASAR KAYITLARI ──────────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    claims_data = [
        # Onaylı — AI analiz tamamlandı, ödenmiş
        Claim(claim_number="TES-A8F3D2B1", policy_id=p[0].id, customer_id=c[0].id,
              disaster_id=dep_kahramanmaras.id, disaster_type="deprem",
              description="Deprem sonrası binamın üst katı çöktü, zeminle ciddi çatlaklar oluştu.",
              incident_lat=37.58, incident_lon=36.94,
              damage_score=82, damage_category=DamageCategory.severe,
              affected_area_m2=95, ai_confidence=91,
              estimated_min_cost=380_000, estimated_max_cost=520_000,
              field_inspection_required=False, priority_level=PriorityLevel.critical,
              ai_notes="Ağır yapısal hasar tespit edildi. Çatı ve üst kat tamamen kullanılamaz durumda.",
              expert_report="Ekspertiz raporu mevcut.",
              satellite_score=79, satellite_category="severe", satellite_confidence=87, satellite_class="major-damage",
              status=ClaimStatus.approved, approved_amount=450_000, payment_simulated=True,
              insurer_notes="AI analizi doğrulandı, ödeme yapıldı.",
              created_at=now - timedelta(days=5)),

        # İnceleme bekliyor — yeni
        Claim(claim_number="TES-C4E7A923", policy_id=p[1].id, customer_id=c[1].id,
              disaster_id=sel_kastamonu.id, disaster_type="sel",
              description="Sel baskını nedeniyle bodrum kat tamamen su altında kaldı, mobilyalar hasar gördü.",
              incident_lat=41.95, incident_lon=34.01,
              damage_score=58, damage_category=DamageCategory.moderate,
              affected_area_m2=60, ai_confidence=84,
              estimated_min_cost=95_000, estimated_max_cost=145_000,
              field_inspection_required=False, priority_level=PriorityLevel.medium,
              ai_notes="Orta düzey sel hasarı. Yapı iskeleti sağlam, iç mekan ve temel hasarlı.",
              expert_report="Ekspertiz raporu mevcut.",
              satellite_score=54, satellite_category="moderate", satellite_confidence=81, satellite_class="minor-damage",
              status=ClaimStatus.reviewed, payment_simulated=False,
              created_at=now - timedelta(days=2)),

        # AI analiz yapılıyor (pending simülasyonu)
        Claim(claim_number="TES-B2D9F541", policy_id=p[2].id, customer_id=c[2].id,
              disaster_id=yangin_mugla.id, disaster_type="yangin",
              description="Komşu parseldeki yangın evin çatısına sıçradı.",
              incident_lat=37.03, incident_lon=27.43,
              status=ClaimStatus.pending, payment_simulated=False,
              created_at=now - timedelta(hours=3)),

        # Reddedildi
        Claim(claim_number="TES-E1C8B374", policy_id=p[3].id, customer_id=c[3].id,
              disaster_id=dolu_konya.id, disaster_type="dolu",
              description="Dolu nedeniyle tarla tamamen zarar gördü, ürün hasadı yok.",
              incident_lat=37.92, incident_lon=32.52,
              damage_score=22, damage_category=DamageCategory.minor,
              affected_area_m2=8000, ai_confidence=76,
              estimated_min_cost=28_000, estimated_max_cost=55_000,
              field_inspection_required=False, priority_level=PriorityLevel.low,
              ai_notes="Uydu analizi hafif hasar tespit etti, beyan edilen hasar miktarıyla örtüşmüyor.",
              expert_report="Ekspertiz raporu mevcut.",
              satellite_score=18, satellite_category="minor", satellite_confidence=79, satellite_class="no-damage",
              status=ClaimStatus.rejected, payment_simulated=False,
              insurer_notes="AI analizi hasarın beyan edilen düzeyde olmadığını gösteriyor.",
              created_at=now - timedelta(days=10)),

        # Yeni bekleyen
        Claim(claim_number="TES-F6A2C891", policy_id=p[5].id, customer_id=c[5].id,
              disaster_type="deprem",
              description="Gece yaşanan artçı sarsıntıda duvarlarda ciddi çatlaklar oluştu.",
              incident_lat=38.46, incident_lon=27.11,
              damage_score=45, damage_category=DamageCategory.moderate,
              affected_area_m2=75, ai_confidence=82,
              estimated_min_cost=75_000, estimated_max_cost=120_000,
              field_inspection_required=False, priority_level=PriorityLevel.medium,
              ai_notes="Orta hasar, yapısal temel bütünlüğü risk altında.",
              expert_report="Ekspertiz raporu mevcut.",
              satellite_score=48, satellite_category="moderate", satellite_confidence=83, satellite_class="minor-damage",
              status=ClaimStatus.reviewed, payment_simulated=False,
              created_at=now - timedelta(days=1)),

        # Critical — hemen aksiyon gerekli
        Claim(claim_number="TES-D3F7E012", policy_id=p[4].id, customer_id=c[4].id,
              disaster_type="yangin",
              description="Komşu binalardaki yangın daireme sıçradı.",
              incident_lat=41.04, incident_lon=28.86,
              damage_score=91, damage_category=DamageCategory.total,
              affected_area_m2=110, ai_confidence=94,
              estimated_min_cost=680_000, estimated_max_cost=950_000,
              field_inspection_required=False, priority_level=PriorityLevel.critical,
              ai_notes="Total hasar. Yapı yeniden inşa gerektirecek düzeyde.",
              expert_report="Ekspertiz raporu mevcut.",
              satellite_score=93, satellite_category="total", satellite_confidence=91, satellite_class="destroyed",
              status=ClaimStatus.reviewed, payment_simulated=False,
              created_at=now - timedelta(hours=8)),
    ]

    db.add_all(claims_data)
    db.commit()

    print("Seed data yuklendi:")
    print(f"   {db.query(User).count()} kullanici")
    print(f"   {db.query(Disaster).count()} aktif afet")
    print(f"   {db.query(Policy).count()} police")
    print(f"   {db.query(Claim).count()} hasar kaydi")
    print()
    print("Demo giris bilgileri:")
    print("  Sigorta Sirketi : demo@anadolusigorta.com / demo1234")
    print("  Sigorta Sirketi : demo@allianz.com.tr    / demo1234")
    print("  Musteri         : ahmet.celik@gmail.com  / demo1234")
    print("  Musteri         : fatma.yildiz@gmail.com / demo1234")
    db.close()


if __name__ == "__main__":
    run()
