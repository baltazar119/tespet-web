"use client";
import { useEffect, useState } from "react";
import { getDisasters, getAffectedPolicies, type Disaster, type AffectedPolicy } from "@/lib/api";
import { DISASTER_TYPE_LABELS, formatCurrency } from "@/lib/utils";
import dynamic from "next/dynamic";
import { AlertTriangle, MapPin, Users, TrendingUp, Activity } from "lucide-react";

const DisasterMap = dynamic(() => import("@/components/DisasterMap"), { ssr: false });

const TYPE_COLORS: Record<string, string> = {
  deprem: "bg-orange-100 text-orange-700 border-orange-200",
  sel: "bg-blue-100 text-blue-700 border-blue-200",
  yangin: "bg-red-100 text-red-700 border-red-200",
  dolu: "bg-cyan-100 text-cyan-700 border-cyan-200",
  heyelan: "bg-amber-100 text-amber-700 border-amber-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-red-100 text-red-700",
  monitoring: "bg-yellow-100 text-yellow-700",
  closed: "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif", monitoring: "İzlemede", closed: "Kapandı",
};

export default function DisastersPage() {
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [selected, setSelected] = useState<Disaster | null>(null);
  const [affected, setAffected] = useState<AffectedPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDisasters().then(setDisasters).finally(() => setLoading(false));
  }, []);

  async function handleSelect(d: Disaster) {
    setSelected(d);
    const policies = await getAffectedPolicies(d.id);
    setAffected(policies);
  }

  const activeCount = disasters.filter((d) => d.status === "active").length;
  const totalAffected = disasters.reduce((s, d) => s + (d.affected_policy_count ?? 0), 0);

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aktif Afetler</h1>
        <p className="text-gray-500 mt-0.5">Anlık afet takibi ve etkilenen poliçe analizi</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: AlertTriangle, label: "Aktif Afet", value: activeCount, color: "text-red-600" },
          { icon: Activity, label: "İzlemedeki Afet", value: disasters.filter(d => d.status === "monitoring").length, color: "text-yellow-600" },
          { icon: Users, label: "Etkilenen Poliçe", value: totalAffected, color: "text-blue-600" },
          { icon: TrendingUp, label: "Toplam Afet", value: disasters.length, color: "text-gray-600" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Icon className={`w-4 h-4 ${color}`} />{label}</div>
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-6">
        {/* Afet listesi */}
        <div className="col-span-2 space-y-3">
          {disasters.map((d) => (
            <button
              key={d.id}
              onClick={() => handleSelect(d)}
              className={`w-full text-left bg-white border rounded-xl p-4 transition hover:shadow-sm ${selected?.id === d.id ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{d.name}</div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                    <MapPin className="w-3 h-3" />{d.city}{d.district ? `, ${d.district}` : ""}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_COLORS[d.disaster_type] ?? "bg-gray-100 text-gray-600"}`}>
                  {DISASTER_TYPE_LABELS[d.disaster_type] ?? d.disaster_type}
                </span>
                {d.magnitude && <span className="text-xs text-gray-500">M{d.magnitude}</span>}
                <span className="text-xs font-semibold text-orange-600">Şiddet {d.severity_score}/100</span>
              </div>

              <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span><span className="font-semibold text-gray-700">{d.affected_policy_count ?? 0}</span> etkilenen poliçe</span>
                {d.satellite_damage_score != null && (
                  <span>Uydu: <span className="font-semibold text-red-600">{d.satellite_damage_score}/100</span></span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Harita + detay */}
        <div className="col-span-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ height: 400 }}>
            <DisasterMap disasters={disasters} selected={selected} onSelect={handleSelect} />
          </div>

          {selected && (
            <div className="mt-4 bg-white border border-gray-200 rounded-xl p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                {selected.name} — Etkilenen Poliçeler ({affected.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {affected.slice(0, 15).map((p, i) => (
                  <div key={p.policy_id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <span className={`text-xs font-bold mr-2 ${i < 3 ? "text-red-600" : i < 8 ? "text-orange-500" : "text-gray-400"}`}>
                        #{i + 1}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{p.policy_number}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.property_city} · {p.distance_km} km</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(p.coverage_amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
