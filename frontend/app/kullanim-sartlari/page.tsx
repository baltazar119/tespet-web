import Link from "next/link";

const SECTIONS = [
  {
    title: "1. Taraflar ve Kapsam",
    content: `Bu sözleşme, Tespet platformu ile platform kullanıcıları arasındaki hukuki ilişkiyi düzenlemektedir. Platforma erişerek veya hesap oluşturarak bu şartları kabul etmiş sayılırsınız. Kabul etmemeniz durumunda platformu kullanmaktan kaçınmanız gerekmektedir.`,
  },
  {
    title: "2. Hizmetin Tanımı",
    content: `Tespet, sigorta şirketleri ve müşterileri için aşağıdaki hizmetleri sunan yapay zeka destekli bir hasar tespit platformudur:
• Uydu görüntüsü analizi ile otomatik hasar tespiti
• Deprem, sel, yangın, dolu ve heyelan hasar kayıt yönetimi
• AI destekli hasar değerlendirme raporları
• Poliçe yönetimi ve takip araçları
• Sigorta şirketleri için gerçek zamanlı afet analiz paneli
• E-posta bildirimleri ve sistem uyarıları

Hizmet "olduğu gibi" sunulmakta olup kesintisiz erişim garanti edilmemektedir.`,
  },
  {
    title: "3. Hesap Oluşturma ve Güvenlik",
    content: `Kullanıcılar gerçek ve güncel bilgi sağlamak, parola gizliliğini korumakla yükümlüdür. Şüpheli erişim durumunda derhal info@tespet.com adresine bildirim yapılmalıdır. Bir hesap yalnızca tek bir kişiye aittir; hesabınızı başkasına devredemezsiniz. Bot hesabı oluşturmak kesinlikle yasaktır.

Sigorta şirketi hesapları yalnızca platform yöneticisi tarafından oluşturulabilir; bu hesaplar üçüncü şahıslara devredilemez.`,
  },
  {
    title: "4. Abonelik ve Ödeme",
    content: `Ücretsiz plan: Sınırlı hasar kaydı görüntüleme ve bildirim özellikleri.
Pro plan: Sınırsız hasar analizi, uydu görüntüsü raporları ve öncelikli destek.

Abonelikler, iptal edilmediği sürece yenileme tarihinden en az 24 saat önce iptal bildiriminde bulunulmadığı takdirde otomatik olarak yenilenir. Kısmi dönem iadeleri yapılmamaktadır. Tespet, 30 günlük önceden bildirimde bulunmak kaydıyla fiyatlandırmayı değiştirme hakkını saklı tutar.`,
  },
  {
    title: "5. Yasaklanan Faaliyetler",
    content: `Aşağıdaki faaliyetler kesinlikle yasaktır:
• Platformun yasadışı amaçlarla kullanımı
• Başkalarının hesaplarına yetkisiz erişim
• Platform güvenliğini tehdit eden girişimler
• Zararlı yazılım dağıtımı
• Platformun kopyalanması veya tersine mühendislik uygulanması
• Veri kazıma ve toplu veri çekme işlemleri
• Rakip ürün geliştirmek amacıyla platformun kullanımı
• Sahte hasar bildirimi oluşturulması

Kurallara aykırılık halinde hesap, uyarı yapılmaksızın askıya alınabilir veya silinebilir.`,
  },
  {
    title: "6. İçerik ve Veri Sahipliği",
    content: `Kullanıcıların yüklediği içerik (hasar görselleri, belgeler vb.) kullanıcıya aittir; Tespet bu içerikleri yalnızca hizmet sunumu amacıyla işler. Platform, AI modelleri ve analiz algoritmaları dahil olmak üzere tüm fikri mülkiyet haklarını saklı tutar. Veriler hesap silinmeden önce JSON formatında dışa aktarılabilir.`,
  },
  {
    title: "7. Gizlilik",
    content: `Kişisel verilerinizin işlenmesine ilişkin ayrıntılı bilgi için Gizlilik Politikamızı inceleyiniz. Verileriniz Türkiye Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmektedir.`,
  },
  {
    title: "8. Hizmet Sürekliliği ve Sorumluluk",
    content: `Tespet, aylık %99,5 kullanılabilirlik hedeflemekte ancak bunu garanti etmemektedir. Veri kaybı, kâr kaybı veya dolaylı zararlardan Tespet sorumlu tutulamaz. Azami sorumluluk, son üç aylık abonelik ücretiyle sınırlıdır.`,
  },
  {
    title: "9. Hesap Sonlandırma",
    content: `Kullanıcılar hesaplarını profil ayarları üzerinden veya e-posta talebiyle silebilir. Tespet; kural ihlali, ödeme başarısızlığı veya hizmetin sonlandırılması (30 gün önceden bildirimle) durumlarında hesabı feshedebilir. Hesap silme işleminin ardından 30 gün boyunca veri dışa aktarımı yapılabilir; bu sürenin sonunda veriler kalıcı olarak silinir.`,
  },
  {
    title: "10. Değişiklikler",
    content: `Önemli güncellemeler kayıtlı e-posta adresinize bildiri gönderilerek duyurulacaktır. Platformu kullanmaya devam etmeniz güncel şartları kabul ettiğiniz anlamına gelir.`,
  },
  {
    title: "11. Uygulanacak Hukuk",
    content: `Bu sözleşme Türk hukukuna tabidir. Uyuşmazlıkların çözümünde Türk mahkemeleri yetkilidir.`,
  },
];

export default function KullanimSartlariPage() {
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
            <h1 className="text-2xl font-black text-white">Kullanım Şartları</h1>
          </div>
          <div className="px-8 py-4 bg-[#D8EEF2]/30 border-b border-[#BBE5ED]/20 flex items-center justify-between">
            <span className="text-sm text-[#026C7C] font-medium">Platformumuzu kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız</span>
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

        {/* İletişim */}
        <div className="mt-6 bg-[#D8EEF2]/40 border border-[#BBE5ED] rounded-2xl px-8 py-5">
          <p className="text-sm font-semibold text-[#101329] mb-1">İletişim</p>
          <p className="text-sm text-gray-600">
            Kullanım şartlarına ilişkin sorularınız için:{" "}
            <a href="mailto:info@tespet.com" className="text-[#026C7C] font-semibold hover:underline">
              info@tespet.com
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2026 Tespet · Tüm hakları saklıdır.</p>
          <Link href="/gizlilik" className="text-xs text-[#026C7C] hover:underline mt-1 inline-block font-medium">
            Gizlilik Politikası →
          </Link>
        </div>
      </main>
    </div>
  );
}
