"""
Tespet - Ekspertiz Raporu PDF Üreticisi
fpdf2 + DejaVuSans TTF → tam Türkçe Unicode desteği
"""
import io
from datetime import datetime
from pathlib import Path
from typing import Optional

from fpdf import FPDF, XPos, YPos

FONT_DIR   = Path(__file__).parent.parent.parent / "fonts"
FONT_REG   = str(FONT_DIR / "DejaVuSans.ttf")
FONT_BOLD  = str(FONT_DIR / "DejaVuSans-Bold.ttf")
USE_TTF    = (FONT_DIR / "DejaVuSans.ttf").exists()

FNAME      = "DejaVu" if USE_TTF else "Helvetica"

# Helvetica fallback için güvenli dönüşüm (TTF yoksa)
_TR_MAP = str.maketrans("ğĞıİşŞ", "gGiIsS")
def _safe(text: str) -> str:
    if USE_TTF:
        return str(text)
    text = str(text).translate(_TR_MAP)
    return text.encode("latin-1", errors="replace").decode("latin-1")

def _enum_str(val) -> str:
    """Enum veya string değeri güvenle string'e çevir."""
    if val is None:
        return ""
    if hasattr(val, "value"):
        return str(val.value)
    return str(val)

DAMAGE_LABELS = {
    "none":     "Hasar Yok",
    "minor":    "Hafif Hasar",
    "moderate": "Orta Hasar",
    "severe":   "Ağır Hasar",
    "total":    "Tam Hasar (Total Zarar)",
}
PRIORITY_LABELS = {
    "low":      "Düşük",
    "medium":   "Orta",
    "high":     "Yüksek",
    "critical": "Kritik",
}
STATUS_LABELS = {
    "pending":   "Bekliyor",
    "analyzing": "Analiz Ediliyor",
    "reviewed":  "İncelendi",
    "approved":  "Onaylandı",
    "rejected":  "Reddedildi",
}
DISASTER_LABELS = {
    "deprem":  "Deprem",
    "sel":     "Sel",
    "yangin":  "Yangın",
    "dolu":    "Dolu",
    "heyelan": "Heyelan",
}


class TespetPDF(FPDF):
    def __init__(self):
        super().__init__()
        if USE_TTF:
            self.add_font(FNAME, style="",  fname=FONT_REG)
            self.add_font(FNAME, style="B", fname=FONT_BOLD)
            self.add_font(FNAME, style="I", fname=FONT_REG)

    def header(self):
        self.set_fill_color(16, 19, 41)
        self.rect(0, 0, 210, 22, "F")
        self.set_font(FNAME, "B", 14)
        self.set_text_color(187, 229, 237)
        self.set_xy(10, 6)
        self.cell(60, 10, "TESPET", new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_font(FNAME, "", 8)
        self.set_xy(100, 8)
        self.cell(100, 6, "Afet Analiz ve Hasar Tespit Platformu",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font(FNAME, "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10,
                  f"Tespet AI Ekspertiz Sistemi  |  Sayfa {self.page_no()}/{{nb}}  |  "
                  f"Gizli ve Kişisel  |  {datetime.now().strftime('%d.%m.%Y')}",
                  new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    def section_title(self, text: str):
        self.ln(4)
        self.set_fill_color(216, 238, 242)
        self.set_text_color(16, 19, 41)
        self.set_font(FNAME, "B", 10)
        self.cell(0, 8, f"  {_safe(text)}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.ln(2)

    def kv_row(self, key: str, value: str, bold_val: bool = False):
        self.set_font(FNAME, "", 9)
        self.set_text_color(80, 80, 80)
        self.cell(55, 7, _safe(key) + ":", new_x=XPos.RIGHT, new_y=YPos.TOP)
        if bold_val:
            self.set_font(FNAME, "B", 9)
        self.set_text_color(16, 19, 41)
        self.multi_cell(0, 7, _safe(value))

    def colored_badge(self, text: str, r: int, g: int, b: int):
        self.set_fill_color(r, g, b)
        self.set_text_color(255, 255, 255)
        self.set_font(FNAME, "B", 9)
        self.cell(50, 8, f"  {_safe(text)}  ", fill=True, align="C",
                  new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_text_color(16, 19, 41)

    def score_bar(self, score: float):
        bar_w, bar_h = 120, 5
        x, y = self.get_x(), self.get_y()
        self.set_fill_color(230, 230, 230)
        self.rect(x, y, bar_w, bar_h, "F")
        filled = bar_w * score / 100
        if score >= 85:
            self.set_fill_color(147, 31, 29)
        elif score >= 55:
            self.set_fill_color(249, 115, 22)
        elif score >= 30:
            self.set_fill_color(234, 179, 8)
        else:
            self.set_fill_color(2, 108, 124)
        self.rect(x, y, filled, bar_h, "F")
        self.set_xy(x + bar_w + 3, y - 1)
        self.set_font(FNAME, "B", 9)
        self.set_text_color(16, 19, 41)
        self.cell(20, 7, f"{int(score)}/100")
        self.set_xy(x, y + bar_h + 2)

    def divider(self):
        self.set_draw_color(216, 238, 242)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)


def _color_for_damage(category: Optional[str]):
    return {
        "none":     (2, 108, 124),
        "minor":    (16, 185, 129),
        "moderate": (245, 158, 11),
        "severe":   (239, 68, 68),
        "total":    (147, 31, 29),
    }.get(category or "moderate", (100, 100, 100))


def generate_claim_pdf(claim, policy=None, image_bytes: Optional[bytes] = None,
                        satellite_bytes: Optional[bytes] = None) -> bytes:
    pdf = TespetPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(10, 28, 10)

    now_str = datetime.now().strftime("%d.%m.%Y %H:%M")

    # ── Başlık ────────────────────────────────────────────────────────────────
    pdf.set_font(FNAME, "B", 16)
    pdf.set_text_color(16, 19, 41)
    pdf.cell(0, 10, "EKSPERTİZ RAPORU", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.set_font(FNAME, "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"Hasar Kayıt No: {claim.claim_number}   |   Tarih: {now_str}",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(4)
    pdf.divider()

    # ── 1. Hasar Durumu ────────────────────────────────────────────────────────
    status    = _enum_str(getattr(claim, "status", "pending")) or "pending"
    status_label = STATUS_LABELS.get(status, status)
    cat       = _enum_str(getattr(claim, "damage_category", None))
    cat_label = DAMAGE_LABELS.get(cat, "Belirsiz")
    r, g, b   = _color_for_damage(cat)

    pdf.section_title("1. HASAR DURUMU")
    pdf.set_x(10)
    pdf.set_font(FNAME, "B", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(55, 7, "Kayıt Durumu:")
    pdf.colored_badge(status_label,
                      *(16, 185, 129) if status == "approved" else
                       (147, 31, 29) if status == "rejected" else
                       (2, 108, 124))
    pdf.ln(9)

    pdf.set_x(10)
    pdf.set_font(FNAME, "B", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(55, 7, "Hasar Kategorisi:")
    pdf.colored_badge(cat_label, r, g, b)
    pdf.ln(9)

    damage_score = getattr(claim, "damage_score", None)
    if damage_score is not None:
        pdf.set_x(10)
        pdf.set_font(FNAME, "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(55, 7, "AI Hasar Skoru:")
        pdf.score_bar(float(damage_score))
        pdf.ln(4)

    # ── 2. Poliçe Bilgileri ────────────────────────────────────────────────────
    pdf.section_title("2. POLİÇE BİLGİLERİ")
    if policy:
        pdf.kv_row("Poliçe Numarası", str(policy.policy_number or "-"))
        pdf.kv_row("Poliçe Türü",     _enum_str(policy.policy_type) or "-")
        pdf.kv_row("Sigorta Bedeli",  f"{policy.coverage_amount:,.0f} TL" if policy.coverage_amount else "-")
        pdf.kv_row("Mülk Adresi",     f"{policy.property_address}, {policy.property_city}")
        pdf.kv_row("Mülk Alanı",      f"{policy.property_area_m2} m²" if policy.property_area_m2 else "-")
    else:
        pdf.kv_row("Poliçe", "Bilgi bulunamadı")

    # ── 3. Hasar Başvuru Bilgileri ─────────────────────────────────────────────
    pdf.section_title("3. HASAR BAŞVURU BİLGİLERİ")
    disaster_type = _enum_str(getattr(claim, "disaster_type", ""))
    pdf.kv_row("Afet Türü",         DISASTER_LABELS.get(disaster_type, disaster_type))
    pdf.kv_row("Başvuru Açıklaması", str(getattr(claim, "description", "-") or "-"))
    inc_lat = getattr(claim, "incident_lat", None)
    if inc_lat:
        pdf.kv_row("Olay Koordinatı",
                   f"{claim.incident_lat:.5f}N, {claim.incident_lon:.5f}E")
    created_at = getattr(claim, "created_at", None)
    if created_at:
        ts = created_at.strftime("%d.%m.%Y %H:%M") if hasattr(created_at, "strftime") else str(created_at)
        pdf.kv_row("Başvuru Tarihi", ts)

    # ── 4. AI Analiz Sonuçları ─────────────────────────────────────────────────
    pdf.section_title("4. YAPAY ZEKA ANALİZ SONUÇLARI")
    ai_conf  = getattr(claim, "ai_confidence", None)
    affected = getattr(claim, "affected_area_m2", None)
    min_cost = getattr(claim, "estimated_min_cost", None)
    max_cost = getattr(claim, "estimated_max_cost", None)
    priority = _enum_str(getattr(claim, "priority_level", None))
    field_req = getattr(claim, "field_inspection_required", False)

    pdf.kv_row("AI Güven Oranı",       f"%{int(ai_conf)}" if ai_conf else "-")
    pdf.kv_row("Etkilenen Alan",        f"{int(affected)} m²" if affected else "-")
    pdf.kv_row("Tahmini Onarım Bedeli",
               f"{min_cost:,.0f} TL — {max_cost:,.0f} TL" if min_cost and max_cost else "-",
               bold_val=True)
    pdf.kv_row("Öncelik Seviyesi",      PRIORITY_LABELS.get(priority, priority or "-"))
    pdf.kv_row("Saha Ekibi Gerekli",    "Evet" if field_req else "Hayır")

    sat_score = getattr(claim, "satellite_score", None)
    sat_cat   = _enum_str(getattr(claim, "satellite_category", None))
    sat_conf  = getattr(claim, "satellite_confidence", None)
    if sat_score is not None:
        pdf.ln(2)
        pdf.set_font(FNAME, "B", 9)
        pdf.set_text_color(2, 108, 124)
        pdf.cell(0, 7, "  Uydu Görüntüsü Analizi (xView2 + NVIDIA):",
                 new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.kv_row("  Uydu Hasar Skoru", f"{int(sat_score)}/100")
        pdf.kv_row("  Uydu Kategorisi",  DAMAGE_LABELS.get(sat_cat, sat_cat or "-"))
        pdf.kv_row("  Uydu Güven Oranı", f"%{int(sat_conf)}" if sat_conf else "-")

    ai_notes = getattr(claim, "ai_notes", None)
    if ai_notes:
        pdf.ln(2)
        pdf.set_font(FNAME, "B", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(55, 7, "AI Değerlendirmesi:")
        pdf.set_font(FNAME, "I", 9)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 6, _safe(str(ai_notes)))

    # ── 5. Görsel Belgeler ─────────────────────────────────────────────────────
    if image_bytes or satellite_bytes:
        pdf.section_title("5. GÖRSEL BELGELER")
        if satellite_bytes:
            try:
                pdf.set_font(FNAME, "B", 8)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(0, 6, "Uydu Görüntüsü (Esri Maxar):",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.image(io.BytesIO(satellite_bytes), w=90)
                pdf.ln(2)
            except Exception:
                pass
        if image_bytes:
            try:
                pdf.set_font(FNAME, "B", 8)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(0, 6, "Hasar Fotoğrafı (Kullanıcı Yükledi):",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.image(io.BytesIO(image_bytes), w=90)
                pdf.ln(2)
            except Exception:
                pass

    # ── 6. Ekspertiz Raporu ────────────────────────────────────────────────────
    expert_report = getattr(claim, "expert_report", None)
    if expert_report:
        pdf.section_title("6. EKSPERTİZ RAPORU (DETAYLI)")
        pdf.set_font(FNAME, "", 8)
        pdf.set_text_color(40, 40, 40)
        for line in str(expert_report).splitlines():
            safe_line = _safe(line)
            if safe_line.strip().isupper() and len(safe_line.strip()) > 4:
                pdf.set_font(FNAME, "B", 9)
                pdf.set_text_color(16, 19, 41)
                pdf.multi_cell(0, 6, safe_line)
                pdf.set_font(FNAME, "", 8)
                pdf.set_text_color(40, 40, 40)
            else:
                pdf.multi_cell(0, 5, safe_line)

    # ── 7. Sigorta Kararı ──────────────────────────────────────────────────────
    approved_amount = getattr(claim, "approved_amount", None)
    insurer_notes   = getattr(claim, "insurer_notes", None)
    if approved_amount or insurer_notes or status in ("approved", "rejected"):
        pdf.section_title("7. SİGORTA ŞİRKETİ KARARI")
        if status == "approved" and approved_amount:
            pdf.set_font(FNAME, "B", 11)
            pdf.set_text_color(16, 185, 129)
            pdf.cell(0, 9, f"  TAZMİNAT ONAYLANDI: {approved_amount:,.0f} TL",
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            if getattr(claim, "payment_simulated", False):
                pdf.set_font(FNAME, "", 9)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(0, 6, "  Ödeme simüle edildi (demo ortamı).",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        elif status == "rejected":
            pdf.set_font(FNAME, "B", 11)
            pdf.set_text_color(147, 31, 29)
            pdf.cell(0, 9, "  TALEP REDDEDİLDİ",
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        if insurer_notes:
            pdf.kv_row("Sigorta Notu", str(insurer_notes))

    # ── İmza ──────────────────────────────────────────────────────────────────
    pdf.ln(6)
    pdf.divider()
    pdf.set_font(FNAME, "I", 8)
    pdf.set_text_color(130, 130, 130)
    pdf.multi_cell(0, 5,
        "Bu rapor Tespet Yapay Zeka Ekspertiz Sistemi tarafından otomatik olarak üretilmiştir. "
        "NVIDIA Llama 3.2 90B Vision ve xView2 ResNet50 modelleri kullanılmıştır. "
        "Rapor hukuki bağlayıcılık taşımaz; nihai karar sigorta şirketi eksperinin onayına tabidir.")

    return bytes(pdf.output())
