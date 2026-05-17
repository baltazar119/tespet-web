"""
Tespet - Ekspertiz Raporu PDF Üreticisi
fpdf2 kullanır — saf Python, sistem bağımlılığı yok.
"""
import io
import os
from datetime import datetime
from typing import Optional

from fpdf import FPDF, XPos, YPos


# Hasar kategorisi Türkçe karşılıkları
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
    "deprem":   "Deprem",
    "sel":      "Sel",
    "yangin":   "Yangın",
    "dolu":     "Dolu",
    "heyelan":  "Heyelan",
}


class TespetPDF(FPDF):
    """Tespet markasına uygun özel PDF sınıfı."""

    def header(self):
        # Koyu arka plan çubuğu
        self.set_fill_color(16, 19, 41)   # #101329
        self.rect(0, 0, 210, 22, "F")

        # Logo metni (gerçek logo yoksa)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(187, 229, 237)   # #BBE5ED
        self.set_xy(10, 6)
        self.cell(60, 10, "TESPET", ln=False)

        # Sağda platform ismi
        self.set_font("Helvetica", "", 8)
        self.set_text_color(187, 229, 237)
        self.set_xy(100, 8)
        self.cell(100, 6, "Afet Analiz ve Hasar Tespit Platformu", align="R")

        self.ln(18)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10,
                  f"Tespet AI Ekspertiz Sistemi  |  Sayfa {self.page_no()}/{{nb}}  |  "
                  f"Gizli ve Kisisel  |  {datetime.now().strftime('%d.%m.%Y')}",
                  align="C")

    # ── Yardımcı metodlar ─────────────────────────────────────────────────

    def section_title(self, text: str):
        self.ln(4)
        self.set_fill_color(216, 238, 242)   # #D8EEF2
        self.set_text_color(16, 19, 41)
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 8, f"  {text}", new_x=XPos.LMARGIN, new_y=YPos.NEXT, fill=True)
        self.ln(2)

    def kv_row(self, key: str, value: str, bold_val: bool = False):
        self.set_font("Helvetica", "", 9)
        self.set_text_color(80, 80, 80)
        self.cell(55, 7, key + ":", new_x=XPos.RIGHT, new_y=YPos.TOP)
        if bold_val:
            self.set_font("Helvetica", "B", 9)
        self.set_text_color(16, 19, 41)
        self.multi_cell(0, 7, value)

    def colored_badge(self, text: str, r: int, g: int, b: int):
        self.set_fill_color(r, g, b)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 9)
        self.cell(50, 8, f"  {text}  ", fill=True, align="C",
                  new_x=XPos.RIGHT, new_y=YPos.TOP)
        self.set_text_color(16, 19, 41)

    def score_bar(self, score: float, label: str = ""):
        """Yüzde çubuğu çiz (0-100)."""
        bar_w = 120
        bar_h = 5
        x = self.get_x()
        y = self.get_y()

        # Arka plan
        self.set_fill_color(230, 230, 230)
        self.rect(x, y, bar_w, bar_h, "F")

        # Dolum — renk skora göre
        filled = bar_w * score / 100
        if score >= 70:
            self.set_fill_color(147, 31, 29)   # kırmızı — ağır
        elif score >= 40:
            self.set_fill_color(245, 158, 11)  # amber — orta
        else:
            self.set_fill_color(2, 108, 124)   # teal — hafif
        self.rect(x, y, filled, bar_h, "F")

        # Skor metni
        self.set_xy(x + bar_w + 3, y - 1)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(16, 19, 41)
        self.cell(20, 7, f"{int(score)}/100")
        self.set_xy(x, y + bar_h + 2)

    def divider(self):
        self.set_draw_color(216, 238, 242)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)


def _color_for_damage(category: Optional[str]):
    """Hasar kategorisine göre RGB renk döndür."""
    return {
        "none":     (2, 108, 124),
        "minor":    (16, 185, 129),
        "moderate": (245, 158, 11),
        "severe":   (239, 68, 68),
        "total":    (147, 31, 29),
    }.get(category or "moderate", (100, 100, 100))


def generate_claim_pdf(claim, policy=None, image_bytes: Optional[bytes] = None,
                        satellite_bytes: Optional[bytes] = None) -> bytes:
    """
    Hasar kaydından PDF ekspertiz raporu üret.
    Döndürür: PDF binary (bytes)
    """
    pdf = TespetPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=18)
    pdf.set_margins(10, 28, 10)

    now_str = datetime.now().strftime("%d.%m.%Y %H:%M")

    # ── Başlık bloğu ───────────────────────────────────────────────────────
    pdf.set_font("Helvetica", "B", 16)
    pdf.set_text_color(16, 19, 41)
    pdf.cell(0, 10, "EKSPERTIZ RAPORU", new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")

    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(100, 100, 100)
    pdf.cell(0, 6, f"Hasar Kayit No: {claim.claim_number}   |   Tarih: {now_str}",
             new_x=XPos.LMARGIN, new_y=YPos.NEXT, align="C")
    pdf.ln(4)
    pdf.divider()

    # ── 1. Hasar Durumu Rozeti ─────────────────────────────────────────────
    status = claim.status or "pending"
    status_label = STATUS_LABELS.get(status, status)
    cat = getattr(claim, "damage_category", None)
    cat_label = DAMAGE_LABELS.get(cat or "", "Belirsiz")
    r, g, b = _color_for_damage(cat)

    pdf.section_title("1. HASAR DURUMU")
    pdf.set_x(10)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(55, 7, "Kayit Durumu:")
    pdf.colored_badge(status_label,
                      *(16, 185, 129) if status == "approved" else
                       (147, 31, 29) if status == "rejected" else
                       (2, 108, 124))
    pdf.ln(9)

    pdf.set_x(10)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(80, 80, 80)
    pdf.cell(55, 7, "Hasar Kategorisi:")
    pdf.colored_badge(cat_label, r, g, b)
    pdf.ln(9)

    damage_score = getattr(claim, "damage_score", None)
    if damage_score is not None:
        pdf.set_x(10)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(55, 7, "AI Hasar Skoru:")
        pdf.score_bar(damage_score)
        pdf.ln(4)

    # ── 2. Poliçe Bilgileri ────────────────────────────────────────────────
    pdf.section_title("2. POLICE BILGILERI")
    if policy:
        pdf.kv_row("Police Numarasi", policy.policy_number or "-")
        pdf.kv_row("Police Turu", policy.policy_type or "-")
        pdf.kv_row("Sigorta Bedeli", f"{policy.coverage_amount:,.0f} TL" if policy.coverage_amount else "-")
        pdf.kv_row("Sigortalı Mulk", f"{policy.property_address}, {policy.property_city}")
        pdf.kv_row("Mulk Alani", f"{policy.property_area_m2} m2" if policy.property_area_m2 else "-")
    else:
        pdf.kv_row("Police", "Bilgi bulunamadi")

    # ── 3. Hasar Başvuru Bilgileri ─────────────────────────────────────────
    pdf.section_title("3. HASAR BASVURU BILGILERI")
    disaster_type = getattr(claim, "disaster_type", "")
    pdf.kv_row("Afet Turu", DISASTER_LABELS.get(disaster_type, disaster_type))
    pdf.kv_row("Basvuru Aciklamasi", getattr(claim, "description", "-") or "-")
    pdf.kv_row("Olay Koordinati",
               f"{claim.incident_lat:.5f}N, {claim.incident_lon:.5f}E"
               if getattr(claim, "incident_lat", None) else "-")

    created_at = getattr(claim, "created_at", None)
    if created_at:
        pdf.kv_row("Basvuru Tarihi", created_at.strftime("%d.%m.%Y %H:%M") if hasattr(created_at, "strftime") else str(created_at))

    # ── 4. AI Analiz Sonuçları ─────────────────────────────────────────────
    pdf.section_title("4. YAPAY ZEKA ANALIZ SONUCLARI")

    ai_conf = getattr(claim, "ai_confidence", None)
    affected = getattr(claim, "affected_area_m2", None)
    min_cost = getattr(claim, "estimated_min_cost", None)
    max_cost = getattr(claim, "estimated_max_cost", None)
    priority = getattr(claim, "priority_level", None)
    field_req = getattr(claim, "field_inspection_required", False)

    pdf.kv_row("AI Guven Orani", f"%{int(ai_conf)}" if ai_conf else "-")
    pdf.kv_row("Etkilenen Alan", f"{int(affected)} m2" if affected else "-")
    pdf.kv_row("Tahmini Onarim Bedeli",
               f"{min_cost:,.0f} TL - {max_cost:,.0f} TL" if min_cost and max_cost else "-",
               bold_val=True)
    pdf.kv_row("Oncelik Seviyesi", PRIORITY_LABELS.get(priority or "", priority or "-"))
    pdf.kv_row("Saha Ekibi Gerekli", "Evet" if field_req else "Hayir")

    # Uydu analizi
    sat_score = getattr(claim, "satellite_score", None)
    sat_cat = getattr(claim, "satellite_category", None)
    sat_conf = getattr(claim, "satellite_confidence", None)
    if sat_score is not None:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(2, 108, 124)
        pdf.cell(0, 7, "  Uydu Goruntüsü Analizi (xView2 + NVIDIA):", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        pdf.kv_row("  Uydu Hasar Skoru", f"{int(sat_score)}/100")
        pdf.kv_row("  Uydu Kategorisi", DAMAGE_LABELS.get(sat_cat or "", sat_cat or "-"))
        pdf.kv_row("  Uydu Guven Orani", f"%{int(sat_conf)}" if sat_conf else "-")

    # AI Notu
    ai_notes = getattr(claim, "ai_notes", None)
    if ai_notes:
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_text_color(80, 80, 80)
        pdf.cell(55, 7, "AI Degerlendirmesi:")
        pdf.set_font("Helvetica", "I", 9)
        pdf.set_text_color(50, 50, 50)
        pdf.multi_cell(0, 6, ai_notes)

    # ── 5. Görsel Belgeler ─────────────────────────────────────────────────
    has_images = image_bytes or satellite_bytes
    if has_images:
        pdf.section_title("5. GORSEL BELGELER")

        if satellite_bytes:
            try:
                sat_stream = io.BytesIO(satellite_bytes)
                y_before = pdf.get_y()
                pdf.set_font("Helvetica", "B", 8)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(0, 6, "Uydu Goruntüsü (Esri Maxar):",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.image(sat_stream, w=90)
                pdf.ln(2)
            except Exception:
                pass

        if image_bytes:
            try:
                img_stream = io.BytesIO(image_bytes)
                pdf.set_font("Helvetica", "B", 8)
                pdf.set_text_color(80, 80, 80)
                pdf.cell(0, 6, "Hasar Fotografı (Kullanici Yukledi):",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
                pdf.image(img_stream, w=90)
                pdf.ln(2)
            except Exception:
                pass

    # ── 6. Ekspertiz Raporu (tam metin) ────────────────────────────────────
    expert_report = getattr(claim, "expert_report", None)
    if expert_report:
        pdf.section_title("6. EKSPERTIZ RAPORU (DETAYLI)")
        pdf.set_font("Helvetica", "", 8)
        pdf.set_text_color(40, 40, 40)
        # Uzun metni satır satır yaz
        for line in (expert_report or "").splitlines():
            if line.strip().isupper() and len(line.strip()) > 4:
                pdf.set_font("Helvetica", "B", 9)
                pdf.set_text_color(16, 19, 41)
                pdf.multi_cell(0, 6, line)
                pdf.set_font("Helvetica", "", 8)
                pdf.set_text_color(40, 40, 40)
            else:
                pdf.multi_cell(0, 5, line)

    # ── 7. Sigorta Kararı ─────────────────────────────────────────────────
    approved_amount = getattr(claim, "approved_amount", None)
    insurer_notes = getattr(claim, "insurer_notes", None)
    if approved_amount or insurer_notes or status in ("approved", "rejected"):
        pdf.section_title("7. SIGORTA SIRKETI KARARI")
        if status == "approved" and approved_amount:
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(16, 185, 129)
            pdf.cell(0, 9, f"  TAZMINAT ONAYLANDI: {approved_amount:,.0f} TL",
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            pdf.set_font("Helvetica", "", 9)
            pdf.set_text_color(80, 80, 80)
            if getattr(claim, "payment_simulated", False):
                pdf.cell(0, 6, "  Odeme simule edildi (demo ortami).",
                         new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        elif status == "rejected":
            pdf.set_font("Helvetica", "B", 11)
            pdf.set_text_color(147, 31, 29)
            pdf.cell(0, 9, "  TALEP REDDEDILDI",
                     new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        if insurer_notes:
            pdf.kv_row("Sigorta Notu", insurer_notes)

    # ── İmza alanı ────────────────────────────────────────────────────────
    pdf.ln(6)
    pdf.divider()
    pdf.set_font("Helvetica", "I", 8)
    pdf.set_text_color(130, 130, 130)
    pdf.multi_cell(0, 5,
        "Bu rapor Tespet Yapay Zeka Ekspertiz Sistemi tarafindan otomatik olarak uretilmistir. "
        "NVIDIA Llama 3.2 90B Vision ve xView2 ResNet50 modelleri kullanilmistir. "
        "Rapor hukuki baglayicilik tasimaz; nihai karar sigorta sirketi eksperinin onayina tabidir.")

    return bytes(pdf.output())
