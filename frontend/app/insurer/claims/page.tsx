"use client";
import { useEffect, useState } from "react";
import { getClaims, type Claim } from "@/lib/api";
import { formatCurrency, STATUS_LABELS, statusColor, priorityColor, PRIORITY_LABELS, DAMAGE_LABELS, damageScoreColor, DISASTER_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { Filter, ChevronRight, Clock } from "lucide-react";

const FILTER_STATUSES = ["", "pending", "analyzing", "reviewed", "approved", "rejected"];
const FILTER_PRIORITIES = ["", "critical", "high", "medium", "low"];
const FILTER_TYPES = ["", "deprem", "sel", "yangin", "dolu", "heyelan"];

export default function InsurerClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterType, setFilterType] = useState("");

  useEffect(() => {
    const params: Record<string, string> = {};
    if (filterStatus) params.status = filterStatus;
    if (filterPriority) params.priority_level = filterPriority;
    if (filterType) params.disaster_type = filterType;
    setLoading(true);
    getClaims(params).then(setClaims).finally(() => setLoading(false));
  }, [filterStatus, filterPriority, filterType]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hasar Kayıtları</h1>
          <p className="text-gray-500 mt-0.5">{claims.length} kayıt</p>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Filter className="w-4 h-4" />Filtrele:
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-[#026C7C] font-medium ${filterStatus ? "bg-[#026C7C] text-white border-[#026C7C]" : "bg-white text-gray-700 border-gray-300"}`}>
          <option value="">Tüm Durumlar</option>
          {FILTER_STATUSES.filter(Boolean).map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
          className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-[#026C7C] font-medium ${filterPriority ? "bg-[#026C7C] text-white border-[#026C7C]" : "bg-white text-gray-700 border-gray-300"}`}>
          <option value="">Tüm Öncelikler</option>
          {FILTER_PRIORITIES.filter(Boolean).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className={`text-sm rounded-lg px-3 py-1.5 border focus:outline-none focus:ring-2 focus:ring-[#026C7C] font-medium ${filterType ? "bg-[#026C7C] text-white border-[#026C7C]" : "bg-white text-gray-700 border-gray-300"}`}>
          <option value="">Tüm Afet Türleri</option>
          {FILTER_TYPES.filter(Boolean).map((t) => <option key={t} value={t}>{DISASTER_TYPE_LABELS[t]}</option>)}
        </select>
        {(filterStatus || filterPriority || filterType) && (
          <button onClick={() => { setFilterStatus(""); setFilterPriority(""); setFilterType(""); }} className="text-sm text-[#026C7C] hover:text-[#015f6b] font-medium underline underline-offset-2">
            Temizle ✕
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Kayıt No", "Poliçe", "Afet Türü", "AI Skoru", "Hasar", "Öncelik", "Durum", "Tarih", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">{c.claim_number}</td>
                  <td className="px-4 py-3 text-gray-600">#{c.policy_id}</td>
                  <td className="px-4 py-3">
                    <span className="text-gray-700">{DISASTER_TYPE_LABELS[c.disaster_type] ?? c.disaster_type}</span>
                  </td>
                  <td className="px-4 py-3">
                    {c.damage_score != null ? (
                      <span className={`font-bold ${damageScoreColor(c.damage_score)}`}>{c.damage_score}/100</span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {c.damage_category ? DAMAGE_LABELS[c.damage_category] : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.priority_level ? (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColor(c.priority_level)}`}>
                        {PRIORITY_LABELS[c.priority_level]}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(c.status)}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {c.created_at ? new Date(c.created_at).toLocaleDateString("tr-TR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/insurer/claims/${c.id}`} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-medium">
                      İncele <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {claims.length === 0 && (
            <div className="text-center py-16 text-gray-400 text-sm">Bu filtrelere uygun kayıt bulunamadı.</div>
          )}
        </div>
      )}
    </div>
  );
}
