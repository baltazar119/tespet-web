"use client";
import { useEffect, useState, useMemo } from "react";
import {
  getDisasters, getAffectedPolicies, getClaims, analyzeDisasterSatellite,
  type Disaster, type AffectedPolicy, type DisasterAnalysis,
} from "@/lib/api";
import { DISASTER_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import { MapPin, Map, Search, ArrowRight, Loader2, Satellite, List, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const DisasterMap = dynamic(() => import("@/components/DisasterMap"), { ssr: false });

const CARD_BG: Record<string, string> = {
  deprem:  "bg-amber-50  border-amber-300",
  yangin:  "bg-red-50    border-red-300",
  sel:     "bg-blue-50   border-blue-300",
  dolu:    "bg-cyan-50   border-cyan-300",
  heyelan: "bg-yellow-50 border-yellow-300",
};

const CARD_FOOTER: Record<string, string> = {
  deprem:  "bg-amber-100  text-amber-800  hover:bg-amber-200",
  yangin:  "bg-red-100    text-red-800    hover:bg-red-200",
  sel:     "bg-blue-100   text-blue-800   hover:bg-blue-200",
  dolu:    "bg-cyan-100   text-cyan-800   hover:bg-cyan-200",
  heyelan: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
};

const TYPE_BADGE: Record<string, string> = {
  deprem:  "bg-amber-100  text-amber-700  border-amber-300",
  yangin:  "bg-red-100    text-red-700    border-red-300",
  sel:     "bg-blue-100   text-blue-700   border-blue-300",
  dolu:    "bg-cyan-100   text-cyan-700   border-cyan-300",
  heyelan: "bg-yellow-100 text-yellow-700 border-yellow-300",
};

const STATUS_COLORS: Record<string, string> = {
  active:     "bg-red-100    text-red-700",
  monitoring: "bg-yellow-100 text-yellow-700",
  closed:     "bg-gray-100   text-gray-500",
};
const STATUS_LABELS: Record<string, string> = {
  active: "Aktif", monitoring: "İzlemede", closed: "Kapandı",
};

const FILTER_OPTIONS = [
  { type: "deprem",  label: "Deprem",  active: "bg-amber-500  text-white border-amber-500",  inactive: "bg-white text-amber-700  border-amber-300  hover:bg-amber-50"  },
  { type: "sel",     label: "Sel",     active: "bg-blue-500   text-white border-blue-500",   inactive: "bg-white text-blue-700   border-blue-300   hover:bg-blue-50"   },
  { type: "yangin",  label: "Yangın",  active: "bg-red-500    text-white border-red-500",    inactive: "bg-white text-red-700    border-red-300    hover:bg-red-50"    },
  { type: "dolu",    label: "Dolu",    active: "bg-cyan-500   text-white border-cyan-500",   inactive: "bg-white text-cyan-700   border-cyan-300   hover:bg-cyan-50"   },
  { type: "heyelan", label: "Heyelan", active: "bg-yellow-600 text-white border-yellow-600", inactive: "bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50" },
];

const STATS = [
  { key: "active",        label: "Aktif Afet",       color: "text-[#931F1D]",  bg: "bg-red-50"    },
  { key: "monitoring",    label: "İzlemedeki Afet",  color: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "totalAffected", label: "Etkilenen Poliçe", color: "text-[#026C7C]",  bg: "bg-[#D8EEF2]" },
  { key: "total",         label: "Toplam Afet",      color: "text-[#101329]",  bg: "bg-gray-100"  },
];

export default function DisastersPage() {
  const router = useRouter();
  const [disasters, setDisasters]         = useState<Disaster[]>([]);
  const [selected, setSelected]           = useState<Disaster | null>(null);
  const [affected, setAffected]           = useState<AffectedPolicy[]>([]);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState<string | null>(null);
  const [search, setSearch]               = useState("");
  const [heatMode, setHeatMode]           = useState(false);
  const [navigating, setNavigating]       = useState<number | null>(null);
  const [analyzing, setAnalyzing]         = useState<number | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DisasterAnalysis | null>(null);
  const [analyzeError, setAnalyzeError]   = useState<string | null>(null);

  async function goToClaim(policyId: number) {
    setNavigating(policyId);
    try {
      const claims = await getClaims({ policy_id: String(policyId) });
      if (claims.length > 0) {
        router.push(`/insurer/claims/${claims[0].id}`);
      } else {
        router.push(`/insurer/claims`);
      }
    } finally {
      setNavigating(null);
    }
  }

  useEffect(() => {
    getDisasters().then(setDisasters).finally(() => setLoading(false));
  }, []);

  async function handleSelect(d: Disaster) {
    setSelected(d);
    setAnalysisResult(null);
    setAnalyzeError(null);
    const policies = await getAffectedPolicies(d.id);
    setAffected(policies);
  }

  async function handleAnalyze(d: Disaster) {
    setSelected(d);
    setAnalysisResult(null);
    setAnalyzeError(null);
    setAnalyzing(d.id);
    try {
      const policies = await getAffectedPolicies(d.id);
      setAffected(policies);
      const result = await analyzeDisasterSatellite(d.id);
      setAnalysisResult(result);
      getDisasters().then(setDisasters);
    } catch (err: unknown) {
      setAnalyzeError(err instanceof Error ? err.message : "Analiz sırasında bir hata oluştu.");
    } finally {
      setAnalyzing(null);
    }
  }

  const policyMarkers = useMemo(() => {
    if (!affected.length) return [];
    return affected
      .filter((p) => p.lat != null && p.lon != null)
      .map((p) => {
        const result = analysisResult?.results.find((r) => r.policy_id === p.policy_id);
        return {
          lat: p.lat!,
          lon: p.lon!,
          score: result?.combined_score,
          policyNumber: p.policy_number,
          policyId: p.policy_id,
        };
      });
  }, [affected, analysisResult]);

  const statValues: Record<string, number> = {
    active:        disasters.filter((d) => d.status === "active").length,
    monitoring:    disasters.filter((d) => d.status === "monitoring").length,
    totalAffected: disasters.reduce((s, d) => s + (d.affected_policy_count ?? 0), 0),
    total:         disasters.length,
  };

  const filtered = disasters
    .filter((d) => !filter || d.disaster_type === filter)
    .filter((d) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        d.name.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q) ||
        (d.district ?? "").toLowerCase().includes(q) ||
        DISASTER_TYPE_LABELS[d.disaster_type]?.toLowerCase().includes(q)
      );
    });

  if (loading)
    return (
      <div className="flex justify-center pt-20">
        <div className="w-8 h-8 border-4 border-[#026C7C] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      {/* ── İstatistik kutuları ─────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {STATS.map(({ key, label, color, bg }) => (
          <div
            key={key}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden flex items-stretch shadow-sm"
          >
            <div className={`${bg} flex items-center justify-center px-5 py-4 min-w-[76px]`}>
              <span className={`text-3xl font-black ${color}`}>{statValues[key]}</span>
            </div>
            <div className="flex items-center px-4 py-3 border-l border-gray-100">
              <span className="text-sm font-medium text-gray-600 leading-tight">{label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Arama + Filtre çubuğu ────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <span className="text-xs font-medium text-gray-400">Filtrele:</span>

        <button
          onClick={() => setFilter(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
            !filter
              ? "bg-[#101329] text-white border-[#101329]"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Tümü
        </button>

        {FILTER_OPTIONS.map(({ type, label, active, inactive }) => (
          <button
            key={type}
            onClick={() => setFilter(filter === type ? null : type)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              filter === type ? active : inactive
            }`}
          >
            {label}
          </button>
        ))}

        {/* Arama kutusu */}
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Afet veya şehir ara…"
            className="pl-8 pr-3 py-1.5 rounded-full text-xs border border-gray-200 bg-white focus:outline-none focus:border-[#026C7C] focus:ring-1 focus:ring-[#026C7C]/20 w-44 transition"
          />
        </div>
      </div>

      {/* ── Ana ızgara: liste (2) | harita+detay (4) ────────────────── */}
      <div className="grid grid-cols-6 gap-6">

        {/* Afet listesi */}
        <div className="col-span-2 space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">Arama kriterine uygun afet bulunamadı.</div>
          )}

          {filtered.map((d) => {
            const cardBg   = CARD_BG[d.disaster_type]    ?? "bg-gray-50 border-gray-200";
            const footerBg = CARD_FOOTER[d.disaster_type] ?? "bg-gray-100 text-gray-700 hover:bg-gray-200";
            const badge    = TYPE_BADGE[d.disaster_type]  ?? "bg-gray-100 text-gray-600 border-gray-200";
            const isSel    = selected?.id === d.id;
            const isAnalyzing = analyzing === d.id;

            return (
              <div
                key={d.id}
                className={`w-full text-left border rounded-xl overflow-hidden transition-all ${cardBg} ${
                  isSel ? "ring-2 ring-[#026C7C] ring-offset-1 shadow-md" : "hover:shadow-md"
                }`}
              >
                {/* Tıklanabilir içerik alanı — sadece burası afet seçer */}
                <div className="p-4 pb-3 cursor-pointer" onClick={() => handleSelect(d)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{d.name}</div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {d.city}{d.district ? `, ${d.district}` : ""}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_COLORS[d.status]}`}>
                      {STATUS_LABELS[d.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${badge}`}>
                      {DISASTER_TYPE_LABELS[d.disaster_type] ?? d.disaster_type}
                    </span>
                    {d.magnitude && <span className="text-xs text-gray-500">M{d.magnitude}</span>}
                    <span className="text-xs font-semibold text-gray-600">Şiddet {d.severity_score}/100</span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      <span className="font-semibold text-gray-700">{d.affected_policy_count ?? 0}</span> etkilenen poliçe
                    </span>
                    {d.satellite_damage_score != null && (
                      <span>Uydu: <span className="font-semibold text-[#931F1D]">{d.satellite_damage_score}/100</span></span>
                    )}
                  </div>
                </div>{/* içerik div kapanışı */}

                {/* Kart alt çubuğu: iki ayrı buton — dış div onClick YOK */}
                <div className="grid grid-cols-2 divide-x divide-black/5 border-t border-black/5">
                  <button
                    onClick={() => handleSelect(d)}
                    disabled={isAnalyzing}
                    className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <List className="w-3.5 h-3.5" />
                    Listele
                  </button>
                  <button
                    onClick={() => handleAnalyze(d)}
                    disabled={isAnalyzing}
                    className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition cursor-pointer ${footerBg} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analiz ediliyor…
                      </>
                    ) : (
                      <>
                        <Satellite className="w-3.5 h-3.5" />
                        Uydu Analizi
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Harita + Poliçe Detayı */}
        <div className="col-span-4 flex flex-col gap-4">

          {/* Harita */}
          <div
            className="relative z-0 bg-white border border-gray-200 rounded-xl overflow-hidden"
            style={{ height: 480 }}
          >
            <DisasterMap
              disasters={disasters}
              selected={selected}
              onSelect={handleSelect}
              heatMode={heatMode}
              policyMarkers={policyMarkers}
            />
            <button
              onClick={() => setHeatMode(!heatMode)}
              className="absolute top-3 right-3 z-[1000] flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow hover:bg-[#D8EEF2] transition"
            >
              <Map className="w-3.5 h-3.5" />
              {heatMode ? "Coğrafi Harita" : "Isı Haritası"}
            </button>
          </div>

          {/* Analiz Sonucu Özet Kartı */}
          {analyzeError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{analyzeError}</span>
            </div>
          )}

          {analysisResult && (
            <div className="bg-white border border-[#026C7C]/20 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-2 px-5 py-3 bg-[#026C7C]/10 border-b border-[#026C7C]/10">
                <CheckCircle2 className="w-4 h-4 text-[#026C7C]" />
                <span className="font-semibold text-[#026C7C] text-sm">
                  Uydu Analizi Tamamlandı — {analysisResult.summary.auto_claims} hasar kaydı otomatik oluşturuldu
                </span>
              </div>
              <div className="grid grid-cols-5 divide-x divide-gray-100 text-center">
                {[
                  { label: "Analiz Edilen", value: analysisResult.summary.total_policies },
                  { label: "Ort. Hasar Skoru", value: `${analysisResult.summary.avg_score}/100` },
                  { label: "Yıkık Bina", value: analysisResult.summary.destroyed },
                  { label: "Büyük Hasar", value: analysisResult.summary.major_damage },
                  { label: "Toplam Risk", value: formatCurrency(analysisResult.summary.total_risk_tl) },
                ].map(({ label, value }) => (
                  <div key={label} className="py-3 px-2">
                    <div className="text-lg font-black text-[#101329]">{value}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Etkilenen Poliçeler */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {selected ? (
              <>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 bg-[#D8EEF2]/60">
                  <h3 className="font-semibold text-[#101329] text-sm">
                    {selected.name} — Etkilenen Poliçeler ({affected.length})
                  </h3>
                  {analyzing === selected.id && (
                    <span className="flex items-center gap-1.5 text-xs text-[#026C7C]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uydu analizi yapılıyor, lütfen bekleyin…
                    </span>
                  )}
                </div>
                <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                  {affected.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-sm">Bu afet için etkilenen poliçe bulunamadı.</div>
                  ) : (
                    affected.slice(0, 15).map((p, i) => {
                      const policyResult = analysisResult?.results.find((r) => r.policy_id === p.policy_id);
                      return (
                        <button
                          key={p.policy_id}
                          onClick={() => goToClaim(p.policy_id)}
                          disabled={navigating === p.policy_id}
                          className="w-full flex items-center justify-between px-5 py-2.5 hover:bg-[#D8EEF2]/30 transition text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold w-6 ${i < 3 ? "text-[#931F1D]" : i < 8 ? "text-amber-500" : "text-gray-300"}`}>
                              #{i + 1}
                            </span>
                            <span className="text-sm font-medium text-gray-800">{p.policy_number}</span>
                            <span className="text-xs text-gray-400">{p.property_city} · {p.distance_km} km</span>
                            {policyResult && (
                              <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${
                                policyResult.combined_score >= 70 ? "bg-red-100 text-red-700" :
                                policyResult.combined_score >= 40 ? "bg-amber-100 text-amber-700" :
                                "bg-green-100 text-green-700"
                              }`}>
                                Hasar {policyResult.combined_score}/100
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#026C7C]">{formatCurrency(p.coverage_amount)}</span>
                            {policyResult && (
                              <span className="text-xs text-gray-500">{formatCurrency(policyResult.estimated_loss)} risk</span>
                            )}
                            {navigating === p.policy_id
                              ? <Loader2 className="w-3.5 h-3.5 text-[#026C7C] animate-spin" />
                              : <ArrowRight className="w-3.5 h-3.5 text-[#026C7C]/40" />
                            }
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Map className="w-8 h-8 mb-2 text-gray-200" />
                <span className="text-sm">Detayları görmek için haritadan veya listeden bir afet seçin</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
