"use client";
import { useEffect, useState } from "react";
import { getClaims, type Claim } from "@/lib/api";
import { formatCurrency, STATUS_LABELS, statusColor, damageScoreColor, DISASTER_TYPE_LABELS } from "@/lib/utils";
import Link from "next/link";
import { PlusCircle, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CustomerClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getClaims().then(setClaims).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hasar Kayıtlarım</h1>
          <p className="text-gray-500 mt-0.5">{claims.length} kayıt</p>
        </div>
        <Link href="/customer/claims/new" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-medium transition text-sm">
          <PlusCircle className="w-4 h-4" />Yeni Hasar Kaydı
        </Link>
      </div>

      {claims.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Henüz hasar kaydınız yok.</p>
          <Link href="/customer/claims/new" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Hasar kaydı oluşturun</Link>
        </div>
      )}

      <div className="space-y-4">
        {claims.map((c) => (
          <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm font-semibold text-gray-700">{c.claim_number}</span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(c.status)}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{DISASTER_TYPE_LABELS[c.disaster_type] ?? c.disaster_type} hasarı</p>
              </div>
              {c.damage_score != null && (
                <div className="text-right">
                  <div className={`text-2xl font-bold ${damageScoreColor(c.damage_score)}`}>{c.damage_score}<span className="text-sm font-normal text-gray-400">/100</span></div>
                  <div className="text-xs text-gray-400">Hasar skoru</div>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{c.description}</p>

            {c.status === "analyzing" && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-blue-700 text-sm">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                AI analizi devam ediyor...
              </div>
            )}

            {c.status === "reviewed" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                Sigorta şirketi incelemesinde — yakında yanıt alacaksınız.
              </div>
            )}

            {c.status === "approved" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  Tazminat onaylandı
                </div>
                <span className="font-bold text-green-700">{c.approved_amount ? formatCurrency(c.approved_amount) : "—"}</span>
              </div>
            )}

            {c.status === "rejected" && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700 text-sm">
                <XCircle className="w-4 h-4" />
                Hasar talebi reddedildi {c.insurer_notes ? `— ${c.insurer_notes}` : ""}
              </div>
            )}

            <div className="mt-4 pt-3 border-t text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {c.created_at ? new Date(c.created_at).toLocaleDateString("tr-TR") : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
