"""
Demo veritabanini gercekci Turkiye verileriyle doldur.
Calistir: python seed_data.py
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


REPORT_DEPREM_AGIR = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-A8F3D2B1
Tarih: 12.02.2023

1. HASAR TESPITI OZETI
Kahramanmaras Merkez ilcesinde, Ataturk Cad. No:45 D:3 adresindeki deprem sigortali
konut mulkunde, 06.02.2023 tarihli 7.8 buyuklugundeki deprem sonucunda Agir Hasar
tespit edilmistir. Uydu goruntusu analizi hasar skorunu 100 uzerinden 82 olarak
belirlenmistir. Kombine AI guven orani %91'dir.

2. GORSEL BULGULAR VE ANALIZ
Uydu goruntusu uzerinde yapilan yapay zeka destekli analiz sonucunda asagidaki
hasarlar tespit edilmistir:
- Cati cokme hasari tespit edildi
- Dis duvarlarda genis capli kirilma ve parcalanma
- Yapisal temel hasari gorsel olarak dogrulanmistir
- Komsu binalardan yayilan ikincil hasar
- Ust katlarda kolon-kiris birlesimleri tahrip olmus

Etkilenen toplam alan yaklasik 95 m2 olarak hesaplanmistir.

3. HASAR DEGERLENDIRMESI
Hasar kategorisi "Agir Hasar" olarak siniflandirilmistir. Bina ust kati tamamen
kullanilmaz durumdadir. Zemin katta da onemli kirilmalar mevcuttur. Yapi statik
acidan risk olusturmakta olup tahliye onerilmektedir.

4. TAHMINI TAZMINAT TUTARI
Onarim/yenileme bedeli 380.000 TL ile 520.000 TL arasinda tahmin edilmektedir.
Police teminat bedeli 2.500.000 TL olup tazminat bu limit dahilindedir.
Onaylanan tazminat tutari: 450.000 TL

5. EKSPERIN KANAAT VE ONERISI
Uydu tabanli AI analizi hasarin gercekligini ve kapsamini dogrulamistir.
Saha ekibi gonderimine gerek duyulmamistir; dosya uzaktan inceleme ile
sonuclandirilmistir. Tazminat odemesi baslatilmistir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""

REPORT_SEL_ORTA = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-C4E7A923
Tarih: 14.08.2021

1. HASAR TESPITI OZETI
Kastamonu ili Bozkurt ilcesinde, Cumhuriyet Mah. Bozkurt Cd. No:12 adresindeki
sel sigortali konut mulkunde, 11.08.2021 tarihli sel felaketi sonucunda Orta Hasar
tespit edilmistir. AI hasar skoru: 58/100. Guven orani: %84.

2. GORSEL BULGULAR VE ANALIZ
- Su baskini izleri yapinin alt katlarinda belirgin sekilde gorulmektedir
- Bodrum kat ve zemin kat tamamen su altinda kalmis
- Cevre altyapisinda genis cap su birikintisi tespit edilmistir
- Ic mekanda elektrik tesisati ve zemin kaplamasi hasar gormustir

Etkilenen alan: 60 m2.

3. HASAR DEGERLENDIRMESI
Yapi iskeleti saglam olmakla birlikte ic mekan, zemin kaplama ve elektrik
tesisatinda kapsamli hasar mevcuttur. Tadilat gerektiren bir durum soz konusudur.

4. TAHMINI TAZMINAT TUTARI
Onarim bedeli 95.000 TL ile 145.000 TL arasinda tahmin edilmektedir.
Police teminat bedeli 1.800.000 TL.

5. EKSPERIN KANAAT VE ONERISI
Hasar gercekligini AI analizi dogrulamistir. Saha ekibi gerekli gorulmemistir.
Tazminat odemesi onay beklemektedir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""

REPORT_YANGIN_TOTAL = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-D3F7E012
Tarih: 15.05.2026

1. HASAR TESPITI OZETI
Istanbul Bagcilar ilcesinde, Bagcilar Mah. No:33 D:8 adresindeki konut sigortali
mulkte, komsu binadan yayilan yangin sonucunda Total Hasar tespit edilmistir.
AI hasar skoru: 91/100. Guven orani: %94.

2. GORSEL BULGULAR VE ANALIZ
- Tam yanma hasari tespit edildi; yapi tamamen tahrip olmus
- Cati ve ust yapi komple cokmus durumdadir
- Cevre binalara hasar yayilmistir
- Yangin sonrasi yapisal bagimsizlik kalmamistir

Etkilenen alan: 110 m2.

3. HASAR DEGERLENDIRMESI
Hasar kategorisi "Total Zarar" olarak siniflandirilmistir. Yapi yeniden insa
gerektirecek duzeyide hasar gormustür. Onarim ekonomik degildir.

4. TAHMINI TAZMINAT TUTARI
Yeniden insaat bedeli 680.000 TL ile 950.000 TL arasinda tahmin edilmektedir.
Police teminat bedeli 3.500.000 TL.

5. EKSPERIN KANAAT VE ONERISI
Uydu ve foto analizi total hasari teyit etmektedir. Maksimum tazminat
odemesi onerilmektedir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""

REPORT_IZMIR_DEPREM = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-F6A2C891
Tarih: 31.10.2020

1. HASAR TESPITI OZETI
Izmir Karsiyaka ilcesinde, Karsiyaka Mah. Izmir Cd. No:88 adresindeki deprem
sigortali mulkte, 30.10.2020 tarihli 6.9 buyuklugundeki Izmir depreminde
Orta Hasar tespit edilmistir. AI hasar skoru: 45/100. Guven orani: %82.

2. GORSEL BULGULAR VE ANALIZ
- Dis duvarlarda genis cizgisel catlamalar tespit edilmistir
- Ic mekanda dolgu duvarlari hasarli
- Bodrum katta temel suyu sizmasi belirtileri
- Cati katinda hafif deformasyon

Etkilenen alan: 75 m2.

3. HASAR DEGERLENDIRMESI
Tasiayici yapi elemanlari genel olarak saglam olmakla birlikte dolgu
duvarlarinda ve cephe kaplamalarinda onarim gerektiren hasarlar mevcuttur.
Bina ek guclendrme ve onarim ile kullanilabilir.

4. TAHMINI TAZMINAT TUTARI
Onarim bedeli 75.000 TL ile 120.000 TL arasinda tahmin edilmektedir.
Police teminat bedeli 1.900.000 TL.

5. EKSPERIN KANAAT VE ONERISI
AI analizi orta duzey hasari dogrulamistir. Tazminat odemesi onay
beklemektedir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""

REPORT_DOLU_RED = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-E1C8B374
Tarih: 20.05.2024

1. HASAR TESPITI OZETI
Konya Selcuklu ilcesinde, Havzan Koyu Tarim Parseli adresindeki tarim
sigortali mulkte, 15.05.2024 tarihli dolu yagisi sonrasinda Hafif Hasar
tespit edilmistir. AI hasar skoru: 22/100. Guven orani: %76.

2. GORSEL BULGULAR VE ANALIZ
- Uydu analizi hafif yuzey hasari gostermektedir
- Cati kaplamasinda minimal iz tespit edilmistir
- Tarim urununun beyan edilen hasar duzeyi gorsel bulgularla ortusmuyor

3. HASAR DEGERLENDIRMESI
Beyan edilen hasar miktari ile uydu ve AI analiz bulgulari arasinda
anlamli bir uyumsuzluk saptanmistir. Hasar skoru 22/100 olup hafif
kategoridesinde kalmaktadir.

4. TAZMINAT DEGERLENDIRMESI
Beyan edilen hasar beyan duzeyi AI analizi ile dogrulanamamisir.
Tazminat talebi reddedilmistir.

5. EKSPERIN KANAAT VE ONERISI
Uydu tabanli analiz talep edilen hasar boyutunu dogrulamamaktadir.
Tazminat talebi reddedilmistir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""

REPORT_IZMIR_YENI = """EKSPERTIZ RAPORU
Hasar Kayit No: TES-IZM2026K
Tarih: 17.05.2026

1. HASAR TESPITI OZETI
Izmir Karsiyaka ilcesinde, Karsiyaka Mah. Izmir Cd. No:88 adresinde
artci deprem sonrasi yeni basvuru alinmistir. Analiz surmektedir.

2. GORSEL BULGULAR VE ANALIZ
Uydu ve fotograf analizi devam etmektedir.

3. HASAR DEGERLENDIRMESI
Sonuclar hazir oldugunda guncellenecektir.

Saygilarimla,
Tespet AI Ekspertiz Sistemi"""


def run():
    clear()

    # ── SIGORTA SIRKETLERI ------------------------------------------------
    anadolu = User(
        email="demo@anadolusigorta.com",
        full_name="Mehmet Yilmaz",
        hashed_password=pwd.hash("demo1234"),
        role=UserRole.insurer,
        company_name="Anadolu Sigorta A.S.",
        phone="+90 212 444 0 260",
    )
    allianz = User(
        email="demo@allianz.com.tr",
        full_name="Ayse Kaya",
        hashed_password=pwd.hash("demo1234"),
        role=UserRole.insurer,
        company_name="Allianz Sigorta A.S.",
        phone="+90 212 444 0 300",
    )
    db.add_all([anadolu, allianz])
    db.commit()  # Kullanicilar kesinlikle kaydedilsin
    db.refresh(anadolu)
    db.refresh(allianz)

    # ── MUSTERILER --------------------------------------------------------
    customers = [
        User(email="ahmet.celik@gmail.com",  full_name="Ahmet Celik",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 533 111 2233"),
        User(email="fatma.yildiz@gmail.com", full_name="Fatma Yildiz",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 542 222 3344"),
        User(email="hasan.ozturk@gmail.com", full_name="Hasan Ozturk",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 505 333 4455"),
        User(email="zeynep.sahin@gmail.com", full_name="Zeynep Sahin",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 555 444 5566"),
        User(email="ali.demir@gmail.com",    full_name="Ali Demir",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 535 555 6677"),
        User(email="elif.arslan@gmail.com",  full_name="Elif Arslan",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 545 666 7788"),
        User(email="murat.koc@gmail.com",    full_name="Murat Koc",
             hashed_password=pwd.hash("demo1234"), role=UserRole.customer, phone="+90 525 777 8899"),
    ]
    db.add_all(customers)
    db.commit()  # Musteriler de kaydedilsin
    c = customers

    # ── AKTIF AFETLER ----------------------------------------------------
    dep_kahramanmaras = Disaster(
        name="Kahramanmaras Depremi",
        disaster_type=DisasterType.deprem,
        status=DisasterStatus.active,
        center_lat=37.57, center_lon=36.93,
        radius_km=120,
        city="Kahramanmaras", district="Merkez",
        magnitude=7.8,
        severity_score=92,
        satellite_damage_score=87,
        affected_buildings_estimate=15420,
        description="6 Subat 2023 tarihli Kahramanmaras merkezli deprem serisi.",
        source="AFAD",
        occurred_at=datetime(2023, 2, 6, 4, 17, tzinfo=timezone.utc),
    )
    dep_izmir = Disaster(
        name="Izmir Depremi",
        disaster_type=DisasterType.deprem,
        status=DisasterStatus.active,
        center_lat=38.39, center_lon=26.93,
        radius_km=80,
        city="Izmir", district="Seferihisar",
        magnitude=6.9,
        severity_score=78,
        satellite_damage_score=72,
        affected_buildings_estimate=6234,
        description="30 Ekim 2020 tarihli Izmir aciklari kaynakli deprem. Karsiyaka, Bayrakli ve Bornova en cok etkilenen ilcelerdir.",
        source="AFAD / KOERI",
        occurred_at=datetime(2020, 10, 30, 11, 51, tzinfo=timezone.utc),
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
        name="Mugla Orman Yangini",
        disaster_type=DisasterType.yangin,
        status=DisasterStatus.monitoring,
        center_lat=37.11, center_lon=28.35,
        radius_km=40,
        city="Mugla", district="Bodrum",
        severity_score=65,
        satellite_damage_score=71,
        affected_buildings_estimate=820,
        description="Ege kiyilarini etkileyen orman yangini.",
        source="OGM",
        occurred_at=datetime(2021, 7, 28, tzinfo=timezone.utc),
    )
    dolu_konya = Disaster(
        name="Konya Dolu Yagisi",
        disaster_type=DisasterType.dolu,
        status=DisasterStatus.closed,
        center_lat=37.88, center_lon=32.49,
        radius_km=30,
        city="Konya", district="Selcuklu",
        severity_score=42,
        satellite_damage_score=38,
        affected_buildings_estimate=1100,
        source="MGM",
        occurred_at=datetime(2024, 5, 15, tzinfo=timezone.utc),
    )
    db.add_all([dep_kahramanmaras, dep_izmir, sel_kastamonu, yangin_mugla, dolu_konya])
    db.flush()

    # ── POLICELER --------------------------------------------------------
    policies = [
        # Anadolu Sigorta policeleri
        Policy(policy_number="ANS-2023-00142", customer_id=c[0].id, insurer_id=anadolu.id,
               policy_type=PolicyType.deprem, status=PolicyStatus.active,
               property_address="Ataturk Cad. No:45 D:3", property_city="Kahramanmaras",
               property_district="Merkez", property_lat=37.58, property_lon=36.94,
               property_area_m2=95, coverage_amount=2_500_000, premium_amount=4_800,
               start_date="2023-01-01", end_date="2024-01-01"),

        Policy(policy_number="ANS-2024-00601", customer_id=c[0].id, insurer_id=anadolu.id,
               policy_type=PolicyType.deprem, status=PolicyStatus.active,
               property_address="Guzelyali Mah. Sahil Yolu No:18 D:5", property_city="Kocaeli",
               property_district="Gebze", property_lat=40.777661, property_lon=29.390128,
               property_area_m2=110, coverage_amount=3_200_000, premium_amount=5_400,
               start_date="2024-01-01", end_date="2025-01-01"),

        Policy(policy_number="ANS-2023-00287", customer_id=c[1].id, insurer_id=anadolu.id,
               policy_type=PolicyType.sel, status=PolicyStatus.active,
               property_address="Cumhuriyet Mah. Bozkurt Cd. No:12", property_city="Kastamonu",
               property_district="Bozkurt", property_lat=41.95, property_lon=34.01,
               property_area_m2=120, coverage_amount=1_800_000, premium_amount=3_200,
               start_date="2022-06-01", end_date="2023-06-01"),

        Policy(policy_number="ANS-2024-00391", customer_id=c[2].id, insurer_id=anadolu.id,
               policy_type=PolicyType.yangin, status=PolicyStatus.active,
               property_address="Kiyi Mah. Sahil Blv. No:7", property_city="Mugla",
               property_district="Bodrum", property_lat=37.03, property_lon=27.43,
               property_area_m2=180, coverage_amount=4_200_000, premium_amount=7_500,
               start_date="2024-01-01", end_date="2025-01-01"),

        Policy(policy_number="ANS-2024-00458", customer_id=c[3].id, insurer_id=anadolu.id,
               policy_type=PolicyType.tarim, status=PolicyStatus.active,
               property_address="Havzan Koyu Tarim Parseli", property_city="Konya",
               property_district="Selcuklu", property_lat=37.92, property_lon=32.52,
               property_area_m2=25000, coverage_amount=850_000, premium_amount=2_100,
               start_date="2024-04-01", end_date="2025-04-01"),

        # Allianz policeleri
        Policy(policy_number="ALZ-2023-00821", customer_id=c[4].id, insurer_id=allianz.id,
               policy_type=PolicyType.konut, status=PolicyStatus.active,
               property_address="Bagcilar Mah. No:33 D:8", property_city="Istanbul",
               property_district="Bagcilar", property_lat=41.04, property_lon=28.86,
               property_area_m2=110, coverage_amount=3_500_000, premium_amount=6_200,
               start_date="2023-09-01", end_date="2024-09-01"),

        Policy(policy_number="ALZ-2024-01023", customer_id=c[5].id, insurer_id=allianz.id,
               policy_type=PolicyType.deprem, status=PolicyStatus.active,
               property_address="Karsiyaka Mah. Izmir Cd. No:88", property_city="Izmir",
               property_district="Karsiyaka", property_lat=38.46, property_lon=27.11,
               property_area_m2=75, coverage_amount=1_900_000, premium_amount=3_800,
               start_date="2024-03-01", end_date="2025-03-01"),

        Policy(policy_number="ANS-2024-00512", customer_id=c[6].id, insurer_id=anadolu.id,
               policy_type=PolicyType.dolu, status=PolicyStatus.expired,
               property_address="Akkoy Tarim Arazisi", property_city="Konya",
               property_district="Karatay", property_lat=37.86, property_lon=32.61,
               property_area_m2=15000, coverage_amount=420_000, premium_amount=980,
               start_date="2023-04-01", end_date="2024-04-01"),
    ]
    db.add_all(policies)
    db.flush()
    p = policies

    # ── HASAR KAYITLARI --------------------------------------------------
    now = datetime.now(timezone.utc)

    claims_data = [
        # 1) ONAYLANDI — Kahramanmaras deprem, agir hasar, odenmis
        Claim(
            claim_number="TES-A8F3D2B1",
            policy_id=p[0].id, customer_id=c[0].id,
            disaster_id=dep_kahramanmaras.id, disaster_type="deprem",
            description="Deprem sonrasi binanin ust kati coktu, zeminle ciddi catlamalar olustu.",
            incident_lat=37.58, incident_lon=36.94,
            damage_score=82, damage_category=DamageCategory.severe,
            affected_area_m2=95, ai_confidence=91,
            estimated_min_cost=380_000, estimated_max_cost=520_000,
            field_inspection_required=False, priority_level=PriorityLevel.critical,
            ai_notes="Agir yapisal hasar tespit edildi. Cati ve ust kat tamamen kullanilamaz durumda.",
            expert_report=REPORT_DEPREM_AGIR,
            satellite_score=79, satellite_category="severe",
            satellite_confidence=87, satellite_class="major-damage",
            vlm_score=89,
            status=ClaimStatus.approved, approved_amount=450_000, payment_simulated=True,
            insurer_notes="AI analizi dogrulandi, odeme yapildi.",
            created_at=now - timedelta(days=5),
        ),

        # 2) INCELEME BEKLIYOR — Kastamonu sel, orta hasar
        Claim(
            claim_number="TES-C4E7A923",
            policy_id=p[1].id, customer_id=c[1].id,
            disaster_id=sel_kastamonu.id, disaster_type="sel",
            description="Sel baskini nedeniyle bodrum kat tamamen su altinda kaldi, mobilyalar hasar gordu.",
            incident_lat=41.95, incident_lon=34.01,
            damage_score=58, damage_category=DamageCategory.moderate,
            affected_area_m2=60, ai_confidence=84,
            estimated_min_cost=95_000, estimated_max_cost=145_000,
            field_inspection_required=False, priority_level=PriorityLevel.medium,
            ai_notes="Orta duzey sel hasari. Yapi iskeleti saglamn, ic mekan ve temel hasarli.",
            expert_report=REPORT_SEL_ORTA,
            satellite_score=54, satellite_category="moderate",
            satellite_confidence=81, satellite_class="minor-damage",
            vlm_score=67,
            status=ClaimStatus.reviewed, payment_simulated=False,
            created_at=now - timedelta(days=2),
        ),

        # 3) PENDING — Mugla yangin, yeni basvuru (AI analiz tetiklenecek demo icin)
        Claim(
            claim_number="TES-B2D9F541",
            policy_id=p[2].id, customer_id=c[2].id,
            disaster_id=yangin_mugla.id, disaster_type="yangin",
            description="Komsu parseldeki yangin evin catisina sicramis.",
            incident_lat=37.03, incident_lon=27.43,
            status=ClaimStatus.pending, payment_simulated=False,
            created_at=now - timedelta(hours=3),
        ),

        # 4) REDDEDILDI — Konya dolu, hasar beyan uyusmayan
        Claim(
            claim_number="TES-E1C8B374",
            policy_id=p[3].id, customer_id=c[3].id,
            disaster_id=dolu_konya.id, disaster_type="dolu",
            description="Dolu nedeniyle tarla tamamen zarar gordu, urun hasadi yok.",
            incident_lat=37.92, incident_lon=32.52,
            damage_score=22, damage_category=DamageCategory.minor,
            affected_area_m2=8000, ai_confidence=76,
            estimated_min_cost=28_000, estimated_max_cost=55_000,
            field_inspection_required=False, priority_level=PriorityLevel.low,
            ai_notes="Uydu analizi hafif hasar tespit etti, beyan edilen hasar miktariyla ortusmuyor.",
            expert_report=REPORT_DOLU_RED,
            satellite_score=18, satellite_category="minor",
            satellite_confidence=79, satellite_class="no-damage",
            vlm_score=31,
            status=ClaimStatus.rejected, payment_simulated=False,
            insurer_notes="AI analizi hasarin beyan edilen duzeyde olmadigini gosteriyor.",
            created_at=now - timedelta(days=10),
        ),

        # 5) REVIEWED — Izmir deprem, onay bekliyor (demo: sigorta sirketinin onayladigi sahne)
        Claim(
            claim_number="TES-F6A2C891",
            policy_id=p[5].id, customer_id=c[5].id,
            disaster_id=dep_izmir.id, disaster_type="deprem",
            description="Gece yasanan artci sarsintida duvarlarda ciddi catlamalar olustu. Zemin katta kolon hasari var.",
            incident_lat=38.46, incident_lon=27.11,
            damage_score=45, damage_category=DamageCategory.moderate,
            affected_area_m2=75, ai_confidence=82,
            estimated_min_cost=75_000, estimated_max_cost=120_000,
            field_inspection_required=False, priority_level=PriorityLevel.medium,
            ai_notes="Orta hasar, yapisal temel butunlugu risk altinda. Kolon-kiris birlesimleri kontrol edilmeli.",
            expert_report=REPORT_IZMIR_DEPREM,
            satellite_score=48, satellite_category="moderate",
            satellite_confidence=83, satellite_class="minor-damage",
            vlm_score=38,
            status=ClaimStatus.reviewed, payment_simulated=False,
            created_at=now - timedelta(days=1),
        ),

        # 6) CRITICAL — Istanbul yangin, total hasar, sigorta onay bekliyor
        Claim(
            claim_number="TES-D3F7E012",
            policy_id=p[4].id, customer_id=c[4].id,
            disaster_type="yangin",
            description="Komsu binalardaki yangin daireme sicramis, her yer yanmis.",
            incident_lat=41.04, incident_lon=28.86,
            damage_score=91, damage_category=DamageCategory.total,
            affected_area_m2=110, ai_confidence=94,
            estimated_min_cost=680_000, estimated_max_cost=950_000,
            field_inspection_required=False, priority_level=PriorityLevel.critical,
            ai_notes="Total hasar. Yapi yeniden insa gerektirecek duzeyde.",
            expert_report=REPORT_YANGIN_TOTAL,
            satellite_score=93, satellite_category="total",
            satellite_confidence=91, satellite_class="destroyed",
            vlm_score=86,
            status=ClaimStatus.reviewed, payment_simulated=False,
            created_at=now - timedelta(hours=8),
        ),

        # 7) IZMIR DEPREMI TARIHSEL SENARYO — analiz tamamlanmis, onay bekliyor
        # Bu demo'da "yasanmis afet senaryosu" olarak gosterilecek
        Claim(
            claim_number="TES-IZM2020D",
            policy_id=p[5].id, customer_id=c[5].id,
            disaster_id=dep_izmir.id, disaster_type="deprem",
            description="30 Ekim 2020 Izmir depremi. Karsiyaka'daki dairemde ciddi catlamalar ve bodrum kat su sizmasi var. Zemin kat kolonlari hasarli.",
            incident_lat=38.458, incident_lon=27.108,
            damage_score=52, damage_category=DamageCategory.moderate,
            affected_area_m2=75, ai_confidence=86,
            estimated_min_cost=80_000, estimated_max_cost=130_000,
            field_inspection_required=False, priority_level=PriorityLevel.high,
            ai_notes="Orta duzey deprem hasari. Dis duvarlarda catlakmalar ve temel sizma risgi mevcut. Yapinin tasiyici sistemi genel olarak saglamdir ancak guclendrme onerilmektedir.",
            expert_report=REPORT_IZMIR_DEPREM,
            satellite_score=55, satellite_category="moderate",
            satellite_confidence=84, satellite_class="minor-damage",
            vlm_score=45,
            status=ClaimStatus.approved, approved_amount=95_000, payment_simulated=True,
            insurer_notes="Izmir 2020 depremi tazminati onaylandi ve odendi.",
            created_at=datetime(2020, 11, 2, 9, 30, tzinfo=timezone.utc),
        ),
    ]

    db.add_all(claims_data)
    db.commit()

    print("=" * 50)
    print("Seed data yuklendi:")
    print(f"   {db.query(User).count()} kullanici")
    print(f"   {db.query(Disaster).count()} afet")
    print(f"   {db.query(Policy).count()} police")
    print(f"   {db.query(Claim).count()} hasar kaydi")
    print()
    print("Demo giris bilgileri:")
    print("  Sigorta Sirketi : demo@anadolusigorta.com / demo1234")
    print("  Sigorta Sirketi : demo@allianz.com.tr    / demo1234")
    print("  Musteri         : ahmet.celik@gmail.com  / demo1234  (deprem - onaylandi)")
    print("  Musteri         : elif.arslan@gmail.com  / demo1234  (Izmir depremi - onay bekliyor)")
    print("  Musteri         : ali.demir@gmail.com    / demo1234  (yangin - critical)")
    print("=" * 50)
    db.close()


if __name__ == "__main__":
    run()
