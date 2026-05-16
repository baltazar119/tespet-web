"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getPolicies, createClaim, type Policy } from "@/lib/api";
import { POLICY_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import { MapPin, Upload, Loader2, CheckCircle, Brain } from "lucide-react";
import dynamic from "next/dynamic";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

const DISASTER_TYPES = [
  { value: "deprem", label: "Deprem", icon: "🌍" },
  { value: "sel", label: "Sel", icon: "🌊" },
  { value: "yangin", label: "Yangın", icon: "🔥" },
  { value: "dolu", label: "Dolu", icon: "🌨️" },
  { value: "heyelan", label: "Heyelan", icon: "⛰️" },
  { value: "diger", label: "Diğer", icon: "📋" },
];

function NewClaimForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<number | "">("");
  const [disasterType, setDisasterType] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [claimNumber, setClaimNumber] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPolicy || !disasterType || !coords) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("policy_id", String(selectedPolicy));
    fd.append("disaster_type", disasterType);
    fd.append("description", description);
    fd.append("incident_lat", String(coords.lat));
    fd.append("incident_lon", String(coords.lon));
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

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Hasar Kaydınız Oluşturuldu</h2>
        <p className="text-gray-500 mb-4">Kayıt numaranız:</p>
        <div className="bg-gray-100 rounded-xl px-6 py-4 font-mono text-lg font-bold text-gray-800 mb-6">{claimNumber}</div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-800 font-medium text-sm">AI Analizi Başlatıldı</p>
              <p className="text-blue-600 text-sm mt-1">Uydu görüntüsü analizi ve hasar değerlendirmesi birkaç dakika içinde tamamlanacak. Sonuçlar hasar kayıtlarınızda görüntülenecek.</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <button onClick={() => router.push("/customer/claims")} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition text-sm">
            Kayıtlarımı Görüntüle
          </button>
          <button onClick={() => { setSubmitted(false); setDisasterType(""); setDescription(""); setImage(null); }} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition text-sm">
            Yeni Kayıt Oluştur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hasar Kaydı Oluştur</h1>
        <p className="text-gray-500 mt-0.5">AI sistemi hasar konumunuzu otomatik analiz edecek.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Poliçe seç */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Poliçe Seçin</label>
          <select
            value={selectedPolicy}
            onChange={(e) => setSelectedPolicy(Number(e.target.value))}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Poliçe seçin --</option>
            {policies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.policy_number} · {POLICY_TYPE_LABELS[p.policy_type]} · {p.property_city} · {formatCurrency(p.coverage_amount)}
              </option>
            ))}
          </select>
          {selectedPolicyData && (
            <div className="mt-3 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
              <span className="font-medium">{selectedPolicyData.property_address}</span>, {selectedPolicyData.property_city} · {selectedPolicyData.property_area_m2} m²
            </div>
          )}
        </div>

        {/* Hasar türü */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Hasar Türü</label>
          <div className="grid grid-cols-3 gap-2">
            {DISASTER_TYPES.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDisasterType(d.value)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-lg border-2 transition text-sm font-medium ${
                  disasterType === d.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span className="text-2xl">{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Koordinat / harita */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            <MapPin className="w-4 h-4 inline mr-1" />
            Hasar Konumu
          </label>
          <div className="rounded-xl overflow-hidden border border-gray-200 h-64">
            <MapPicker coords={coords} onChange={setCoords} />
          </div>
          {coords && (
            <p className="text-xs text-gray-400 mt-2">
              {coords.lat.toFixed(5)}°K, {coords.lon.toFixed(5)}°D
            </p>
          )}
          <button
            type="button"
            onClick={() => navigator.geolocation?.getCurrentPosition((p) => setCoords({ lat: p.coords.latitude, lon: p.coords.longitude }))}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Mevcut konumumu kullan
          </button>
        </div>

        {/* Açıklama */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Hasar Açıklaması</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            placeholder="Hasar nasıl oluştu? Gördüğünüz hasarı detaylı anlatın..."
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Görsel yükleme */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">Fotoğraf (Opsiyonel)</label>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition"
          >
            {image ? (
              <div className="text-sm text-gray-700">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                {image.name}
              </div>
            ) : (
              <>
                <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Fotoğraf yüklemek için tıklayın</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG — maks. 10 MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedPolicy || !disasterType || !coords}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" />Gönderiliyor...</>
          ) : (
            <><Brain className="w-5 h-5" />Kaydı Oluştur ve AI Analizini Başlat</>
          )}
        </button>
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
