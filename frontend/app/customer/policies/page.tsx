"use client";
import { useEffect, useState } from "react";
import { getPolicies, type Policy } from "@/lib/api";
import { formatCurrency, POLICY_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Calendar, Shield, TrendingUp, AlertTriangle, ChevronRight } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  deprem: "🌍", sel: "🌊", yangin: "🔥", dolu: "🌨️", tarim: "🌾", konut: "🏠",
};

const TYPE_CARD: Record<string, { border: string; bg: string; glow: string; footer: string; badge: string }> = {
  deprem: {
    border: "border-amber-200",
    bg:     "bg-amber-50",
    glow:   "rgba(245,158,11,0.07)",
    footer: "bg-amber-100 hover:bg-amber-200 text-amber-900",
    badge:  "bg-amber-100 text-amber-700",
  },
  sel: {
    border: "border-blue-200",
    bg:     "bg-blue-50",
    glow:   "rgba(59,130,246,0.07)",
    footer: "bg-blue-100 hover:bg-blue-200 text-blue-900",
    badge:  "bg-blue-100 text-blue-700",
  },
  yangin: {
    border: "border-red-200",
    bg:     "bg-red-50",
    glow:   "rgba(239,68,68,0.07)",
    footer: "bg-red-100 hover:bg-red-200 text-red-900",
    badge:  "bg-red-100 text-red-700",
  },
  dolu: {
    border: "border-cyan-200",
    bg:     "bg-cyan-50",
    glow:   "rgba(6,182,212,0.07)",
    footer: "bg-cyan-100 hover:bg-cyan-200 text-cyan-900",
    badge:  "bg-cyan-100 text-cyan-700",
  },
  tarim: {
    border: "border-green-200",
    bg:     "bg-green-50",
    glow:   "rgba(34,197,94,0.07)",
    footer: "bg-green-100 hover:bg-green-200 text-green-900",
    badge:  "bg-green-100 text-green-700",
  },
  konut: {
    border: "border-purple-200",
    bg:     "bg-purple-50",
    glow:   "rgba(168,85,247,0.07)",
    footer: "bg-purple-100 hover:bg-purple-200 text-purple-900",
    badge:  "bg-purple-100 text-purple-700",
  },
};

const FALLBACK = {
  border: "border-gray-200", bg: "bg-gray-50", glow: "rgba(0,0,0,0.04)",
  footer: "bg-gray-100 hover:bg-gray-200 text-gray-700", badge: "bg-gray-100 text-gray-600",
};

const STATS = [
  { key: "active",    label: "Aktif Poliçe",    icon: Shield,    color: "text-[#026C7C]",  bg: "bg-[#D8EEF2]" },
  { key: "coverage",  label: "Toplam Teminat",  icon: TrendingUp, color: "text-[#101329]", bg: "bg-gray-100"   },
  { key: "premium",   label: "Yıllık Prim",     icon: Calendar,  color: "text-amber-600",  bg: "bg-amber-50"  },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    getPolicies().then(setPolicies).finally(() => setLoading(false));
  }, []);

  const active = policies.filter((p) => p.status === "active");

  const statValues: Record<string, string> = {
    active:   String(active.length),
    coverage: formatCurrency(active.reduce((s, p) => s + p.coverage_amount, 0)),
    premium:  formatCurrency(active.reduce((s, p) => s + p.premium_amount, 0)),
  };

  if (loading)
    return (
      <div className="flex justify-center pt-20">
        <div className="w-8 h-8 border-4 border-[#026C7C] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#101329]">Poliçelerim</h1>
        <p className="text-gray-500 mt-0.5">
          {active.length} aktif poliçe · {formatCurrency(active.reduce((s, p) => s + p.coverage_amount, 0))} toplam teminat
        </p>
      </div>

      {/* İstatistik kutuları */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {STATS.map(({ key, label, icon: Icon, color, bg }) => (
          <div key={key} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex items-stretch shadow-sm">
            <div className={`${bg} flex items-center justify-center px-5 py-4 min-w-[64px]`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex flex-col justify-center px-4 py-3 border-l border-gray-100">
              <div className={`text-xl font-black ${color}`}>{statValues[key]}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Poliçe listesi */}
      <div className="space-y-4">
        {policies.map((p) => {
          const theme = TYPE_CARD[p.policy_type] ?? FALLBACK;
          const isActive = p.status === "active";

          return (
            <div
              key={p.id}
              className={`border rounded-2xl overflow-hidden transition shadow-sm hover:shadow-md ${theme.border} ${isActive ? "" : "opacity-60"}`}
              style={{
                background: `radial-gradient(ellipse at top right, ${theme.glow} 0%, transparent 65%), var(--tw-bg-opacity, #fff)`,
                backgroundColor: "#fff",
              }}
            >
              {/* Üst bölüm */}
              <div className={`${theme.bg} px-5 pt-5 pb-4`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-13 h-13 w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${theme.bg} ${theme.border}`}>
                      {TYPE_ICONS[p.policy_type] ?? "📋"}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-[#101329] text-base">
                          {POLICY_TYPE_LABELS[p.policy_type] ?? p.policy_type} Sigortası
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {isActive ? "Aktif" : "Pasif"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 font-mono mt-0.5">{p.policy_number}</p>
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                        <MapPin className="w-3.5 h-3.5" />
                        {p.property_address}, {p.property_city}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="text-xl font-black text-[#101329]">{formatCurrency(p.coverage_amount)}</div>
                    <div className="text-xs text-gray-400 mt-0.5">Teminat bedeli</div>
                  </div>
                </div>
              </div>

              {/* Orta: detaylar */}
              <div className="px-5 py-3 bg-white border-t border-black/5 flex items-center gap-6 text-sm text-gray-500">
                <span><span className="font-semibold text-gray-700">{p.property_area_m2} m²</span> · {p.property_district}</span>
                <span>Bitiş: <span className="font-semibold text-gray-700">{p.end_date}</span></span>
                <span>Prim: <span className="font-semibold text-gray-700">{formatCurrency(p.premium_amount)}</span></span>
              </div>

              {/* Alt: Hasar Bildir butonu */}
              {isActive && (
                <Link
                  href={`/customer/claims/new?policy_id=${p.id}`}
                  className={`flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold transition ${theme.footer}`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Hasar Bildir
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
