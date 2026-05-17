import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Veri Sorumlusu",
    content: `"Tespet" markası altında faaliyet gösteren bu platform, Türkiye Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında veri sorumlusu sıfatıyla hareket etmektedir. İletişim: info@tespet.com`,
  },
  {
    title: "2. İşlenen Kişisel Veriler",
    content: `Platform aşağıdaki verileri işlemektedir:
• Kimlik ve iletişim bilgileri (ad, soyad, e-posta adresi, telefon numarası)
• Hesap bilgileri (şifreli parola, profil bilgileri)
• Poliçe ve hasar bilgileri (adres, koordinat, hasar türü, görsel belgeler)
• Teknik veriler (IP adresi, tarayıcı türü, oturum çerezleri)
• Uydu analizi ve yapay zeka değerlendirme sonuçları`,
  },
  {
    title: "3. İşleme Amaçları",
    content: `Veriler şu amaçlarla işlenmektedir:
• Üyelik ve hesap yönetimi
• Poliçe ve hasar kaydı hizmetlerinin sunulması
• Uydu görüntüsü ve AI destekli hasar analizi
• E-posta bildirimleri ve sistem uyarıları
• Platform güvenliği ve hile önleme
• Yasal yükümlülüklerin yerine getirilmesi`,
  },
  {
    title: "4. Hukuki Dayanak (KVKK Madde 5)",
    content: `İşleme faaliyetleri şu hukuki dayanaklar çerçevesinde yürütülmektedir:
• Sözleşmenin ifası: Temel hasar tespit ve poliçe yönetimi işlevleri
• Açık rıza: Pazarlama e-postaları ve opsiyonel bildirimler
• Meşru menfaat: Güvenlik kayıtları ve platform iyileştirme
• Hukuki yükümlülük: Yasal düzenlemeler kapsamındaki veriler`,
  },
  {
    title: "5. Üçüncü Taraflar ve Veri Aktarımları",
    content: `Veriler aşağıdaki hizmet sağlayıcılara aktarılabilmektedir; tümü GDPR uyumludur:
• Supabase Inc. — Veritabanı ve kimlik doğrulama altyapısı
• Vercel Inc. — Uygulama barındırma hizmetleri
• Türksat A.Ş. — Uydu görüntüsü altyapısı
• NVIDIA — AI model işleme altyapısı

Uluslararası veri aktarımları yeterli koruma standartları çerçevesinde gerçekleştirilmektedir.`,
  },
  {
    title: "6. Saklama Süreleri",
    content: `• Hesap verileri: Hesap silinene kadar
• Hasar ve poliçe kayıtları: Hesap silinene kadar veya yasal saklama süresi dolana kadar
• E-posta logları: 1 yıl
• Teknik loglar: 90 gün
• Yasal zorunluluk gerektiren veriler: İlgili mevzuatta öngörülen süre`,
  },
  {
    title: "7. Haklarınız (KVKK Madde 11)",
    content: `Aşağıdaki haklara sahipsiniz:
• Kişisel verilerinizin işlenip işlenmediğini öğrenme
• İşlenen veriler hakkında bilgi talep etme
• Verilerin hangi üçüncü taraflara aktarıldığını öğrenme
• Hatalı verilerin düzeltilmesini isteme
• "Hesabı Sil" özelliği veya e-posta yoluyla verilerin silinmesini talep etme
• Sözleşme kapsamı dışındaki işlemlere itiraz etme
• Veri taşınabilirliği talep etme

Haklarınızı kullanmak için: info@tespet.com`,
  },
  {
    title: "8. Çerezler",
    content: `Yalnızca zorunlu oturum çerezleri kullanılmaktadır. Üçüncü taraf takip çerezleri veya reklam çerezleri kullanılmamaktadır.`,
  },
  {
    title: "9. Güvenlik",
    content: `Verilerinizi korumak için şu önlemler alınmaktadır:
• HTTPS/TLS şifreleme
• Bcrypt ile şifreli parola depolama
• Rol tabanlı erişim kontrolü
• Düzenli güvenlik güncellemeleri`,
  },
  {
    title: "10. Değişiklikler",
    content: `Bu politikada yapılacak önemli değişiklikler, kayıtlı e-posta adresine bildirim gönderilerek duyurulacaktır.`,
  },
];

export default function GizlilikPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-[#101329] shadow-lg">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/login">
            <img src="/logo.png" alt="Tespet" className="h-9 w-auto object-contain brightness-0 invert opacity-90" />
          </Link>
          <Link
            href="/login"
            className="text-[#BBE5ED]/60 hover:text-[#BBE5ED] text-sm font-medium transition"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </header>

      {/* İçerik */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Başlık */}
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-8">
          <div className="bg-[#101329] px-8 py-6">
            <div className="text-[#BBE5ED]/50 text-xs uppercase tracking-widest mb-1">Tespet Sigorta Platformu</div>
            <h1 className="text-2xl font-black text-white">Gizlilik Politikası</h1>
          </div>
          <div className="px-8 py-4 bg-[#D8EEF2]/30 border-b border-[#BBE5ED]/20 flex items-center justify-between">
            <span className="text-sm text-[#026C7C] font-medium">KVKK kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metni</span>
            <span className="text-xs text-gray-400 font-medium">Son güncelleme: Mayıs 2026</span>
          </div>
        </div>

        {/* Bölümler */}
        <div className="space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.title} className="bg-white border border-gray-200 rounded-2xl px-8 py-6 shadow-sm">
              <h2 className="text-base font-bold text-[#101329] mb-3">{s.title}</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{s.content}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2026 Tespet · Tüm hakları saklıdır.</p>
          <Link href="/kullanim-sartlari" className="text-xs text-[#026C7C] hover:underline mt-1 inline-block font-medium">
            Kullanım Şartları →
          </Link>
        </div>
      </main>
    </div>
  );
}
