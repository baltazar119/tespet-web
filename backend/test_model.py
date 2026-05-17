"""
xView2 modelini test et.
Kullanım: python test_model.py [görsel_yolu]
Görsel yoksa Kahramanmaraş'tan örnek URL indirir.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.services.xview2_service import predict_satellite_damage

def test_with_file(path: str):
    with open(path, "rb") as f:
        data = f.read()
    print(f"Dosya: {path} ({len(data)//1024} KB)")
    result = predict_satellite_damage(data)
    print_result(result)

def test_with_url(url: str):
    import urllib.request
    print(f"İndiriliyor: {url}")
    with urllib.request.urlopen(url, timeout=10) as r:
        data = r.read()
    print(f"İndirildi: {len(data)//1024} KB")
    result = predict_satellite_damage(data)
    print_result(result)

def print_result(r: dict):
    print()
    print("=" * 40)
    print(f"  Skor           : {r['satellite_score']}/100")
    print(f"  Kategori       : {r['satellite_category']}")
    print(f"  Sınıf          : {r['satellite_class']}")
    print(f"  Güven          : %{r['satellite_confidence']}")
    if r.get('satellite_probs'):
        probs = r['satellite_probs']
        labels = ["no-damage","minor","major","destroyed"]
        print(f"  Olasılıklar    :", " | ".join(f"{l}:{p:.2f}" for l,p in zip(labels,probs)))
    print("=" * 40)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg.startswith("http"):
            test_with_url(arg)
        else:
            test_with_file(arg)
    else:
        # Test görseli: basit bir gri kare oluştur
        from PIL import Image
        import io
        img = Image.new("RGB", (256, 256), color=(100, 110, 90))
        buf = io.BytesIO()
        img.save(buf, format="JPEG")
        data = buf.getvalue()
        print("Test görseli: 256x256 piksel sentetik görüntü")
        result = predict_satellite_damage(data)
        print_result(result)
