"use client";
import { useEffect, useState } from "react";
import { getPolicies, type Policy } from "@/lib/api";
import { formatCurrency, POLICY_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { MapPin, Calendar, Shield, PlusCircle, ChevronRight, TrendingUp } from "lucide-react";

const TYPE_ICONS: Record<string, string> = {
  deprem: "🌍", sel: "🌊", yangin: "🔥", dolu: "🌨️", tarim: "🌾", konut: "🏠",
};

const TYPE_COLORS: Record<string, string> = {
  deprem: "bg-orange-50 border-orange-200",
  sel: "bg-blue-50 border-blue-200",
  yangin: "bg-red-50 border-red-200",
  dolu: "bg-cyan-50 border-cyan-200",
  tarim: "bg-green-50 border-green-200",
  konut: "bg-purple-50 border-purple-200",
};

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPolicies().then(setPolicies).finally(() => setLoading(false));
  }, []);

  const active = policies.filter((p) => p.status === "active");
  const totalCoverage = active.reduce((sum, p) => sum + p.coverage_amount, 0);

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Poliçelerim</h1>
          <p className="text-gray-500 mt-0.5">{active.length} aktif poliçe · {formatCurrency(totalCoverage)} toplam teminat</p>
        </div>
        <Link
          href="/customer/claims/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Hasar Kaydı Oluştur
        </Link>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Shield className="w-4 h-4" />Aktif Poliçe</div>
          <div className="text-2xl font-bold text-gray-900">{active.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><TrendingUp className="w-4 h-4" />Toplam Teminat</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalCoverage)}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-500 text-sm mb-1"><Calendar className="w-4 h-4" />Yıllık Prim</div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(active.reduce((s, p) => s + p.premium_amount, 0))}</div>
        </div>
      </div>

      <div className="grid gap-4">
        {policies.map((p) => (
          <div key={p.id} className={`border rounded-xl p-5 bg-white hover:shadow-sm transition ${p.status !== "active" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl ${TYPE_COLORS[p.policy_type] ?? "bg-gray-50 border-gray-200"}`}>
                  {TYPE_ICONS[p.policy_type] ?? "📋"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{POLICY_TYPE_LABELS[p.policy_type] ?? p.policy_type} Sigortası</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.status === "active" ? "Aktif" : "Pasif"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{p.policy_number}</p>
                  <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                    <MapPin className="w-3.5 h-3.5" />
                    {p.property_address}, {p.property_city}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{formatCurrency(p.coverage_amount)}</div>
                <div className="text-xs text-gray-400 mt-0.5">Teminat bedeli</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t flex items-center justify-between">
              <div className="flex gap-6 text-sm text-gray-500">
                <span><span className="font-medium text-gray-700">{p.property_area_m2} m²</span> · {p.property_district}</span>
                <span>Bitiş: <span className="font-medium text-gray-700">{p.end_date}</span></span>
                <span>Prim: <span className="font-medium text-gray-700">{formatCurrency(p.premium_amount)}</span></span>
              </div>
              {p.status === "active" && (
                <Link
                  href={`/customer/claims/new?policy_id=${p.id}`}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Hasar Bildir <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
