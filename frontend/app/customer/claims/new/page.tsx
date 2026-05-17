"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPolicies, createClaim, type Policy } from "@/lib/api";
import { POLICY_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { MapPin, Upload, Loader2, CheckCircle, Brain, Shield, FileText, ChevronDown } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const DISASTER_TYPES = [
  { value: "deprem",  label: "Deprem",  icon: "🌍", color: "border-amber-400 bg-amber-50 text-amber-800",  activeRing: "ring-amber-400" },
  { value: "sel",     label: "Sel",     icon: "🌊", color: "border-blue-400  bg-blue-50  text-blue-800",   activeRing: "ring-blue-400"  },
  { value: "yangin",  label: "Yangın",  icon: "🔥", color: "border-red-400   bg-red-50   text-red-800",    activeRing: "ring-red-400"   },
  { value: "dolu",    label: "Dolu",    icon: "🌨️", color: "border-cyan-400  bg-cyan-50  text-cyan-800",   activeRing: "ring-cyan-400"  },
  { value: "heyelan", label: "Heyelan", icon: "⛰️", color: "border-yellow-400 bg-yellow-50 text-yellow-800", activeRing: "ring-yellow-400" },
  { value: "diger",   label: "Diğer",   icon: "📋", color: "border-gray-400  bg-gray-50  text-gray-700",   activeRing: "ring-gray-400"  },
];

function SectionHeader({ num, title, subtitle }: { num: number; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-4 mb-5">
      <div className="w-8 h-8 rounded-full bg-[#026C7C] text-white flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
        {num}
      </div>
      <div>
        <div className="text-sm font-bold text-[#101329] uppercase tracking-wide">{title}</div>
        {subtitle && <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}

function NewClaimForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [policies,        setPolicies]        = useState<Policy[]>([]);
  const [selectedPolicy,  setSelectedPolicy]  = useState<number | "">("");
  const [disasterType,    setDisasterType]    = useState("");
  const [description,     setDescription]     = useState("");
  const [coords,          setCoords]          = useState<{ lat: number; lon: number } | null>(null);
  const [image,           setImage]           = useState<File | null>(null);
  const [agreed,          setAgreed]          = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [submitted,       setSubmitted]       = useState(false);
  const [claimNumber,     setClaimNumber]     = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const formDate = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });

  useEffect(() => {
    getPolicies().then((ps) => {
      const active = ps.filter((p) => p.status === "active");
      setPolicies(active);
      const pid = searchParams.get("policy_id");
      if (pid) setSelectedPolicy(Number(pid));
    });
  }, [searchParams]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) =>
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude })
      );
    }
  }, []);

  const selectedPolicyData = policies.find((p) => p.id === selectedPolicy);
  const canSubmit = selectedPolicy && disasterType && coords && agreed;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    const fd = new FormData();
    fd.append("policy_id",    String(selectedPolicy));
    fd.append("disaster_type", disasterType);
    fd.append("description",  description);
    fd.append("incident_lat", String(coords!.lat));
    fd.append("incident_lon", String(coords!.lon));
    if (image) fd.append("image", image);
    try {
      const claim = await createClaim(fd);
      setClaimNumber(claim.claim_number);
      setSubmitted(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  }

  /* ── Başarı ekranı ────────────────────────────────────────────────── */
  if (submitted) {
    return (
      <div className="max-w-xl mx-auto py-12">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-[#101329] px-8 py-6 text-center">
            <div className="w-16 h-16 bg-green-500/20 border-2 border-green-400/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white">Hasar Bildirimi Alındı</h2>
            <p className="text-[#BBE5ED]/60 text-sm mt-1">Başvurunuz sisteme kaydedildi</p>
          </div>

          <div className="px-8 py-6">
            <div className="bg-[#D8EEF2]/50 border border-[#BBE5ED] rounded-xl px-6 py-4 text-center mb-5">
              <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Kayıt Numarası</div>
              <div className="font-mono text-xl font-bold text-[#026C7C]">{claimNumber}</div>
            </div>

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-800 font-semibold text-sm">AI Analizi Başlatıldı</p>
                <p className="text-blue-600 text-sm mt-1 leading-relaxed">
                  Uydu görüntüsü analizi ve hasar değerlendirmesi birkaç dakika içinde tamamlanacak. Sonuçlar hasar kayıtlarınızda görüntülenecek.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => router.push("/customer/claims")}
                className="flex-1 py-2.5 bg-[#026C7C] text-white rounded-xl font-semibold text-sm hover:bg-[#026C7C]/90 transition"
              >
                Kayıtlarımı Görüntüle
              </button>
              <button
                onClick={() => { setSubmitted(false); setDisasterType(""); setDescription(""); setImage(null); setAgreed(false); }}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-50 transition"
              >
                Yeni Bildirim
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Ana form ─────────────────────────────────────────────────── */
  return (
    <div className="max-w-3xl mx-auto">

      {/* Belge başlığı */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="bg-[#101329] px-8 py-5 flex items-center justify-between">
          <div>
            <div className="text-[#BBE5ED]/50 text-xs uppercase tracking-widest mb-1">Tespet Sigorta Platformu</div>
            <div className="text-white text-xl font-black tracking-wide">HASAR BİLDİRİM FORMU</div>
          </div>
          <div className="text-right">
            <div className="text-[#BBE5ED]/40 text-xs uppercase tracking-wide mb-1">Tarih</div>
            <div className="text-[#BBE5ED]/80 text-sm font-medium">{formDate}</div>
          </div>
        </div>
        <div className="px-8 py-3 bg-[#D8EEF2]/40 border-b border-[#BBE5ED]/30 flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-[#026C7C]" />
          <span className="text-xs text-[#026C7C] font-medium">
            Formu eksiksiz doldurun. AI sistemi hasar konumunuzu otomatik olarak analiz edecektir.
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">

        {/* ── 1. Poliçe Seçimi ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionHeader num={1} title="Poliçe Bilgileri" subtitle="Hasarı bildirmek istediğiniz poliçeyi seçin" />

          <div className="relative">
            <select
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(Number(e.target.value))}
              required
              className="w-full px-4 py-3 pr-10 border border-gray-200 rounded-xl text-sm bg-white appearance-none focus:outline-none focus:border-[#026C7C] focus:ring-2 focus:ring-[#026C7C]/15 transition"
            >
              <option value="">— Poliçe seçin —</option>
              {policies.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.policy_number}  ·  {POLICY_TYPE_LABELS[p.policy_type]}  ·  {p.property_city}  ·  {formatCurrency(p.coverage_amount)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {selectedPolicyData && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              {[
                { label: "Poliçe No",  value: selectedPolicyData.policy_number },
                { label: "Tür",        value: `${POLICY_TYPE_LABELS[selectedPolicyData.policy_type]} Sigortası` },
                { label: "Adres",      value: `${selectedPolicyData.property_address}, ${selectedPolicyData.property_city}` },
                { label: "Teminat",    value: formatCurrency(selectedPolicyData.coverage_amount) },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#D8EEF2]/40 rounded-xl px-4 py-2.5">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-0.5">{label}</div>
                  <div className="text-sm font-semibold text-[#101329]">{value}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 2. Hasar Türü ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionHeader num={2} title="Hasar Türü" subtitle="Meydana gelen afet veya hasar türünü belirtin" />

          <div className="grid grid-cols-3 gap-3">
            {DISASTER_TYPES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDisasterType(d.value)}
                className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 text-sm font-semibold transition ${
                  disasterType === d.value
                    ? `${d.color} ring-2 ${d.activeRing} ring-offset-1`
                    : "border-gray-200 text-gray-500 hover:border-gray-300 bg-white hover:bg-gray-50"
                }`}
              >
                <span className="text-xl">{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 3. Hasar Konumu ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionHeader num={3} title="Hasar Konumu" subtitle="Haritadan hasar bölgesini işaretleyin" />

          <div className="rounded-xl overflow-hidden border border-gray-200 isolate" style={{ height: 280 }}>
            <MapPicker coords={coords} onChange={setCoords} />
          </div>

          <div className="mt-3 flex items-center justify-between">
            {coords ? (
              <div className="flex items-center gap-2 text-xs text-[#026C7C] bg-[#D8EEF2]/50 border border-[#BBE5ED] rounded-lg px-3 py-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {coords.lat.toFixed(5)}°K, {coords.lon.toFixed(5)}°D
              </div>
            ) : (
              <span className="text-xs text-gray-400">Konum belirlenmedi</span>
            )}
            <button
              type="button"
              onClick={() => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }))}
              className="text-xs text-[#026C7C] hover:underline font-medium"
            >
              Mevcut konumumu kullan →
            </button>
          </div>
        </div>

        {/* ── 4. Hasar Açıklaması ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionHeader num={4} title="Hasar Açıklaması" subtitle="Hasarın nasıl oluştuğunu ve kapsamını detaylıca anlatın" />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            placeholder="Örnek: Deprem sonrası binanın dış cephesinde çatlaklar oluştu, 2. katta tavan hasarı meydana geldi..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#026C7C] focus:ring-2 focus:ring-[#026C7C]/15 resize-none transition placeholder:text-gray-300"
          />
          <div className="text-right text-xs text-gray-300 mt-1">{description.length} karakter</div>
        </div>

        {/* ── 5. Fotoğraf ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <SectionHeader num={5} title="Fotoğraf / Belge" subtitle="Hasara ait görsel kanıt yükleyin (opsiyonel)" />

          <div
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              image
                ? "border-[#026C7C] bg-[#D8EEF2]/30"
                : "border-gray-200 hover:border-[#026C7C]/50 hover:bg-[#D8EEF2]/20"
            }`}
          >
            {image ? (
              <div>
                <CheckCircle className="w-8 h-8 text-[#026C7C] mx-auto mb-2" />
                <p className="text-sm font-semibold text-[#026C7C]">{image.name}</p>
                <p className="text-xs text-gray-400 mt-1">{(image.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500 font-medium">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-xs text-gray-300 mt-1">JPG, PNG — maks. 10 MB</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>

        {/* ── Beyan & Gönder ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <input
              type="checkbox"
              id="agree"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-[#026C7C] cursor-pointer flex-shrink-0"
            />
            <label htmlFor="agree" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
              Yukarıda belirttiğim bilgilerin doğru ve eksiksiz olduğunu, gerçeğe aykırı beyanda bulunmanın yasal sonuçları olduğunu bilerek bu formu onaylıyorum.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full bg-[#026C7C] hover:bg-[#026C7C]/90 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition flex items-center justify-center gap-2.5 text-base shadow-sm"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 animate-spin" />Gönderiliyor…</>
            ) : (
              <><Brain className="w-5 h-5" />Bildirimi Gönder ve AI Analizini Başlat</>
            )}
          </button>

          {!canSubmit && !loading && (
            <p className="text-center text-xs text-gray-300 mt-2">
              {!selectedPolicy ? "Poliçe seçin" : !disasterType ? "Hasar türü seçin" : !coords ? "Konum belirleyin" : "Beyan onayını işaretleyin"}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default function NewClaimPage() {
  return (
    <Suspense>
      <NewClaimForm />
    </Suspense>
  );
}
