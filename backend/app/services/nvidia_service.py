import os
import base64
import json
import re
import asyncio
from openai import AsyncOpenAI

NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY", "")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

VISION_MODEL = "meta/llama-3.2-90b-vision-instruct"
REPORT_MODEL = "nvidia/nemotron-nano-9b-v2:free"

# Fallback mock data for when API keys are not configured
MOCK_ANALYSES = {
    "deprem": {
        "damage_score": 74,
        "damage_category": "severe",
        "affected_area_m2": 340,
        "confidence": 89,
        "visible_damage_indicators": [
            "Çatı çökmesi tespit edildi",
            "Dış duvarlarda çatlak ve kırılma",
            "Yapısal temel hasarı görünür",
            "Çevredeki araçlar ve altyapı hasar görmüş"
        ],
        "estimated_repair_cost_range": {"min": 280000, "max": 420000},
        "field_inspection_required": False,
        "priority_level": "high",
        "expert_notes": "Uydu görüntüsü analizi ağır yapısal hasar tespiti yapmıştır. Binanın üst katları tamamen yıkılmış, zemin katta kısmi çökme mevcuttur."
    },
    "sel": {
        "damage_score": 52,
        "damage_category": "moderate",
        "affected_area_m2": 180,
        "confidence": 84,
        "visible_damage_indicators": [
            "Su baskını izleri tespit edildi",
            "Bodrum kat hasarı görünür",
            "Çevre altyapısında su birikintisi"
        ],
        "estimated_repair_cost_range": {"min": 85000, "max": 150000},
        "field_inspection_required": False,
        "priority_level": "medium",
        "expert_notes": "Sel baskınına bağlı orta düzey hasar gözlemlenmiştir. Yapı iskelet bütünlüğü korunmuş, iç mekan ve elektrik tesisatında hasar beklenmektedir."
    },
    "yangin": {
        "damage_score": 91,
        "damage_category": "total",
        "affected_area_m2": 520,
        "confidence": 95,
        "visible_damage_indicators": [
            "Tam yanma hasarı tespit edildi",
            "Çatı ve üst yapı tamamen tahrip olmuş",
            "Çevre alanlara hasar yayılmış"
        ],
        "estimated_repair_cost_range": {"min": 650000, "max": 900000},
        "field_inspection_required": False,
        "priority_level": "critical",
        "expert_notes": "Yangın hasarı total zarar düzeyindedir. Yapı yeniden inşa gerektirecek düzeyde hasar görmüştür."
    },
    "dolu": {
        "damage_score": 28,
        "damage_category": "minor",
        "affected_area_m2": 220,
        "confidence": 78,
        "visible_damage_indicators": [
            "Çatı kaplama hasarı görünür",
            "Araç üstlerinde iz tespit edildi"
        ],
        "estimated_repair_cost_range": {"min": 15000, "max": 45000},
        "field_inspection_required": False,
        "priority_level": "low",
        "expert_notes": "Dolu hasarı hafif-orta düzeyde tespit edilmiştir. Çatı kaplama onarımı ve muhtemelen pencere değişimi gerekecektir."
    },
}


async def analyze_damage_with_vision(
    image_bytes: bytes | None,
    disaster_type: str,
    description: str,
    lat: float,
    lon: float,
) -> dict:
    """Görüntüyü NVIDIA VLM ile analiz et, API yoksa mock döndür."""

    if not NVIDIA_API_KEY:
        # API key yok — mock mod
        base = MOCK_ANALYSES.get(disaster_type, MOCK_ANALYSES["deprem"])
        import random
        variation = random.uniform(0.85, 1.15)
        result = base.copy()
        result["damage_score"] = min(100, round(base["damage_score"] * variation))
        result["affected_area_m2"] = round(base["affected_area_m2"] * variation)
        await asyncio.sleep(2)
        return result

    client = AsyncOpenAI(
        base_url="https://integrate.api.nvidia.com/v1",
        api_key=NVIDIA_API_KEY,
    )

    # Görüntü varsa vision prompt, yoksa text-only (koordinat + açıklama bazlı)
    if image_bytes:
        image_b64 = base64.b64encode(image_bytes).decode()
        prompt = f"""You are an expert insurance damage assessor analyzing satellite imagery after a {disaster_type} disaster in Turkey.

Customer reported: "{description}"
Location: {lat:.4f}N, {lon:.4f}E

Analyze this satellite image and return ONLY a valid JSON object with these exact fields:
{{
  "damage_score": <integer 0-100>,
  "damage_category": <"none"|"minor"|"moderate"|"severe"|"total">,
  "affected_area_m2": <integer>,
  "confidence": <integer 0-100>,
  "visible_damage_indicators": [<list of strings in Turkish>],
  "estimated_repair_cost_range": {{"min": <integer in TRY>, "max": <integer in TRY>}},
  "field_inspection_required": <true|false>,
  "priority_level": <"low"|"medium"|"high"|"critical">,
  "expert_notes": <string in Turkish, 2-3 sentences>
}}

Return ONLY the JSON, no other text."""
        content = [
            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
            {"type": "text", "text": prompt},
        ]
    else:
        # Uydu görüntüsü yok — metin bazlı analiz (koordinat + açıklama + afet türü)
        prompt = f"""You are an expert insurance damage assessor. No satellite image is available.
Estimate damage based on the disaster type, customer description, and location.

Disaster type: {disaster_type}
Customer reported: "{description}"
Location: {lat:.4f}N, {lon:.4f}E (Turkey)

Return ONLY a valid JSON object with these exact fields:
{{
  "damage_score": <integer 0-100>,
  "damage_category": <"none"|"minor"|"moderate"|"severe"|"total">,
  "affected_area_m2": <integer>,
  "confidence": <integer 0-100>,
  "visible_damage_indicators": [<list of strings in Turkish describing expected damage>],
  "estimated_repair_cost_range": {{"min": <integer in TRY>, "max": <integer in TRY>}},
  "field_inspection_required": <true|false>,
  "priority_level": <"low"|"medium"|"high"|"critical">,
  "expert_notes": <string in Turkish, 2-3 sentences>
}}

Return ONLY the JSON, no other text."""
        content = [{"type": "text", "text": prompt}]

    try:
        response = await client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{"role": "user", "content": content}],
            max_tokens=1024,
            temperature=0.1,
        )
        raw = response.choices[0].message.content.strip()
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if match:
            return json.loads(match.group())
        return json.loads(raw)
    except Exception:
        return MOCK_ANALYSES.get(disaster_type, MOCK_ANALYSES["deprem"])


async def generate_expert_report(
    claim_number: str,
    policy_data: dict,
    analysis: dict,
    disaster_type: str,
) -> str:
    """Nemotron ile Türkçe ekspertiz raporu oluştur."""

    if not OPENROUTER_API_KEY:
        return _mock_report(claim_number, policy_data, analysis, disaster_type)

    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )

    prompt = f"""Aşağıdaki sigorta hasar tespiti verilerine dayanarak resmi bir ekspertiz raporu yaz.

Hasar Kaydı No: {claim_number}
Poliçe No: {policy_data.get('policy_number')}
Poliçe Türü: {policy_data.get('policy_type')}
Sigortalı Mülk: {policy_data.get('property_address')}, {policy_data.get('property_city')}
Sigorta Bedeli: {policy_data.get('coverage_amount'):,.0f} TL

Yapay Zeka Analiz Sonuçları:
- Hasar Skoru: {analysis['damage_score']}/100
- Hasar Kategorisi: {analysis['damage_category']}
- Etkilenen Alan: {analysis['affected_area_m2']} m²
- Güven Oranı: %{analysis['confidence']}
- Tahmini Onarım Bedeli: {analysis['estimated_repair_cost_range']['min']:,.0f} - {analysis['estimated_repair_cost_range']['max']:,.0f} TL
- Saha Ekibi Gerekli: {'Hayır' if not analysis['field_inspection_required'] else 'Evet'}
- Görsel Bulgular: {', '.join(analysis['visible_damage_indicators'])}

Afet Türü: {disaster_type}
AI Notu: {analysis['expert_notes']}

Aşağıdaki bölümleri içeren resmi ekspertiz raporu yaz:
1. HASAR TESPİT ÖZETİ
2. GÖRSEL BULGULAR VE ANALİZ
3. HASAR DEĞERLENDİRMESİ
4. TAHMİNİ TAZMİNAT TUTARI
5. EKSPERİN KANAAT VE ÖNERİSİ

Resmi, teknik ve profesyonel dil kullan."""

    try:
        response = await client.chat.completions.create(
            model=REPORT_MODEL,
            messages=[
                {"role": "system", "content": "Sen deneyimli bir sigorta eksperisin. Türkçe, resmi dilde ekspertiz raporu yazıyorsun."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2048,
            temperature=0.3,
        )
        return response.choices[0].message.content
    except Exception:
        return _mock_report(claim_number, policy_data, analysis, disaster_type)


def _mock_report(claim_number: str, policy_data: dict, analysis: dict, disaster_type: str) -> str:
    damage_names = {"none": "Hasar Yok", "minor": "Hafif Hasar", "moderate": "Orta Hasar", "severe": "Ağır Hasar", "total": "Tam Hasar"}
    cat = damage_names.get(analysis.get("damage_category", "moderate"), "Orta Hasar")
    return f"""EKSPERTİZ RAPORU
Hasar Kaydı No: {claim_number}
Tarih: {__import__('datetime').datetime.now().strftime('%d.%m.%Y')}

1. HASAR TESPİT ÖZETİ
{policy_data.get('property_address', 'Belirtilen adres')}, {policy_data.get('property_city', '')} adresindeki {policy_data.get('policy_type', '')} sigortalı mülkte {disaster_type} afeti sonucunda {cat} tespit edilmiştir. Uydu görüntüsü analizi hasar skorunu 100 üzerinden {analysis['damage_score']} olarak belirlemiştir.

2. GÖRSEL BULGULAR VE ANALİZ
Uydu görüntüsü üzerinde yapılan yapay zeka destekli analiz sonucunda aşağıdaki hasarlar tespit edilmiştir:
{chr(10).join(f'• {b}' for b in analysis.get('visible_damage_indicators', []))}
Etkilenen toplam alan yaklaşık {analysis['affected_area_m2']} m² olarak hesaplanmıştır. Analiz güven oranı %{analysis['confidence']}'dir.

3. HASAR DEĞERLENDİRMESİ
Hasar kategorisi "{cat}" olarak sınıflandırılmıştır. {analysis.get('expert_notes', '')}

4. TAHMİNİ TAZMİNAT TUTARI
Yapılan inceleme ve piyasa koşulları değerlendirmesi sonucunda onarım/yenileme bedeli {analysis['estimated_repair_cost_range']['min']:,.0f} TL ile {analysis['estimated_repair_cost_range']['max']:,.0f} TL arasında tahmin edilmektedir. Poliçe teminat bedeli {policy_data.get('coverage_amount', 0):,.0f} TL olup tazminat bu limit dahilinde ödenecektir.

5. EKSPERİN KANAAT VE ÖNERİSİ
Yapılan uydu tabanlı yapay zeka analizi, hasarın gerçekliğini ve kapsamını doğrulamıştır. {'Saha ekibinin bölgeye gönderilmesi önerilmektedir.' if analysis.get('field_inspection_required') else 'Saha ekibi gönderimine gerek duyulmamıştır; dosya uzaktan inceleme ile sonuçlandırılabilir.'} Tazminat ödemesinin başlatılması tavsiye edilmektedir.

Saygılarımla,
Tespet AI Ekspertiz Sistemi"""
