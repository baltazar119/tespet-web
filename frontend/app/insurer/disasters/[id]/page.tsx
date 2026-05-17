"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  getDisaster, analyzeDisasterSatellite,
  type Disaster, type DisasterAnalysis, type DisasterPolicyResult,
} from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Satellite, AlertTriangle, CheckCircle, ChevronLeft,
  Loader2, TrendingUp, Shield, Zap, Building2,
} from "lucide-react";
import Link from "next/link";

const DisasterMap = dynamic(() => import("@/components/DisasterAnalysisMap"), { ssr: false });

const CLASS_COLOR: Record<string, string> = {
  "destroyed":    "bg-red-100 text-red-700 border-red-200",
  "major-damage": "bg-orange-100 text-orange-700 border-orange-200",
  "minor-damage": "bg-yellow-100 text-yellow-700 border-yellow-200",
  "no-damage":    "bg-green-100 text-green-700 border-green-200",
};
const CLASS_LABEL: Record<string, string> = {
  "destroyed":    "Yıkık",
  "major-damage": "Ağır Hasar",
  "minor-damage": "Hafif Hasar",
  "no-damage":    "Hasar Yok",
};
const DISASTER_TYPE_LABELS: Record<string, string> = {
  deprem: "Deprem", sel: "Sel", yangin: "Yangın",
  dolu: "Dolu", heyelan: "Heyelan",
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 75 ? "bg-red-500" : score >= 50 ? "bg-orange-400" : score >= 25 ? "bg-yellow-400" : "bg-green-400";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function DisasterDetailPage() {
  const { id } = useParams();
  const [disaster, setDisaster] = useState<Disaster | null>(null);
  const [analysis, setAnalysis] = useState<DisasterAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<DisasterPolicyResult | null>(null);

  useEffect(() => {
    getDisaster(Number(id)).then(setDisaster);
  }, [id]);

  async function runAnalysis() {
    setAnalyzing(true);
    try {
      const result = await analyzeDisasterSatellite(Number(id));
      setAnalysis(result);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Analiz başarısız");
    } finally {
      setAnalyzing(false);
    }
  }

  if (!disaster) return (
    <div className="flex justify-center pt-20">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const s = analysis?.summary;

  return (
    <div className="max-w-7xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/insurer/disasters" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />Afet Takibi
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-800 text-sm">{disaster.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 ${
          disaster.status === "active" ? "bg-red-100 text-red-700" :
          disaster.status === "monitoring" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
        }`}>
          {disaster.status === "active" ? "Aktif" : disaster.status === "monitoring" ? "İzleniyor" : "Kapalı"}
        </span>
      </div>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{disaster.name}</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {DISASTER_TYPE_LABELS[disaster.disaster_type]} · {disaster.city}
              {disaster.magnitude ? ` · M${disaster.magnitude}` : ""}
              · {disaster.radius_km} km etki alanı
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={analyzing}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-semibold text-sm transition"
          >
            {analyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" />Analiz yapılıyor...</>
              : <><Satellite className="w-4 h-4" />Uydu Analizi Başlat</>
            }
          </button>
        </div>

        {analyzing && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            Esri/Maxar uydu görüntüleri çekiliyor ve xView2 modeli ile hasar analizi yapılıyor...
          </div>
        )}
      </div>

      {/* Özet kartları — analiz sonrası */}
      {s && (
        <div className="grid grid-cols-5 gap-3 mb-5">
          {[
            { icon: Shield, label: "Etkilenen Poliçe", value: s.total_policies, color: "text-blue-600" },
            { icon: TrendingUp, label: "Toplam Risk", value: formatCurrency(s.total_risk_tl), color: "text-red-600" },
            { icon: Zap, label: "Oto. Hasar Kaydı", value: s.auto_claims, color: "text-purple-600" },
            { icon: Building2, label: "Yıkık / Ağır", value: `${s.destroyed + s.major_damage}`, color: "text-red-600" },
            { icon: CheckCircle, label: "Ort. Hasar Skoru", value: `${s.avg_score}/100`, color: s.avg_score > 60 ? "text-red-600" : "text-orange-500" },
          ].map((c) => (
            <div key={c.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
                <c.icon className="w-3.5 h-3.5" />{c.label}
              </div>
              <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-5">
        {/* Harita */}
        <div className="col-span-3 bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: 520 }}>
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Satellite className="w-4 h-4 text-blue-500" />
              Uydu Haritası — Esri/Maxar Gerçek Zaman
            </span>
            {analysis && (
              <span className="text-xs text-gray-400">{analysis.results.length} poliçe analiz edildi</span>
            )}
          </div>
          <DisasterMap
            disaster={disaster}
            results={analysis?.results ?? []}
            selected={selected}
            onSelect={setSelected}
          />
        </div>

        {/* Sonuç listesi */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col" style={{ height: 520 }}>
          <div className="px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-semibold text-gray-700">
              {analysis ? `Hasar Raporu (${analysis.results.length} poliçe)` : "Poliçe Hasar Tablosu"}
            </span>
          </div>

          {!analysis ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400">
              <Satellite className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">"Uydu Analizi Başlat" butonuna tıklayın</p>
              <p className="text-xs mt-1">Esri uydu görüntüleri çekilip xView2 modeli ile analiz edilecek</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {analysis.results.map((r) => (
                <button
                  key={r.policy_id}
                  onClick={() => setSelected(selected?.policy_id === r.policy_id ? null : r)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition ${selected?.policy_id === r.policy_id ? "bg-blue-50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-gray-700">{r.policy_number}</span>
                        {r.auto_created && (
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded font-medium">Oto</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[160px]">{r.property_address}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${CLASS_COLOR[r.satellite_class] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {CLASS_LABEL[r.satellite_class] ?? r.satellite_class}
                      </span>
                      <p className="text-xs text-red-600 font-semibold mt-1">{formatCurrency(r.estimated_loss)}</p>
                    </div>
                  </div>
                  <ScoreBar score={r.combined_score} />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>{r.distance_km} km · {r.image_source === "esri_maxar" ? "🛰️ Esri/Maxar" : "mock"}</span>
                    {r.claim_number && (
                      <span className="font-mono text-purple-600">{r.claim_number}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
