"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getClaim, getPolicy, approveClaim, rejectClaim, downloadClaimReport, type Claim, type Policy } from "@/lib/api";
import {
  formatCurrency, STATUS_LABELS, statusColor, priorityColor, PRIORITY_LABELS,
  DAMAGE_LABELS, damageScoreColor, DISASTER_TYPE_LABELS, POLICY_TYPE_LABELS
} from "@/lib/utils";
import {
  CheckCircle, XCircle, AlertTriangle, Brain, MapPin, Shield,
  FileText, TrendingUp, Clock, ChevronLeft, Loader2, Download
} from "lucide-react";
import Link from "next/link";

export default function ClaimDetailPage() {
  const { id } = useParams();
  const router  = useRouter();
  const [claim, setClaim]   = useState<Claim | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading, setLoading]     = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approveAmount, setApproveAmount] = useState("");
  const [rejectNote,    setRejectNote]    = useState("");
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal,  setShowRejectModal]  = useState(false);

  useEffect(() => {
    getClaim(Number(id)).then(async (c) => {
      setClaim(c);
      if (c.policy_id) {
        const p = await getPolicy(c.policy_id).catch(() => null);
        setPolicy(p);
        if (c.estimated_max_cost) setApproveAmount(String(Math.round(c.estimated_max_cost * 0.9)));
      }
    }).finally(() => setLoading(false));
  }, [id]);

  async function handleApprove() {
    if (!claim) return;
    setApproving(true);
    try {
      const updated = await approveClaim(claim.id, Number(approveAmount));
      setClaim(updated);
      setShowApproveModal(false);
    } finally { setApproving(false); }
  }

  async function handleReject() {
    if (!claim) return;
    setRejecting(true);
    try {
      const updated = await rejectClaim(claim.id, rejectNote);
      setClaim(updated);
      setShowRejectModal(false);
    } finally { setRejecting(false); }
  }

  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadReport() {
    if (!claim) return;
    setPdfLoading(true);
    try {
      await downloadClaimReport(claim.id);
    } catch {
      alert("PDF oluşturulurken hata oluştu.");
    } finally {
      setPdfLoading(false);
    }
  }

  if (loading) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-[#026C7C] border-t-transparent rounded-full animate-spin" /></div>;
  if (!claim)  return <div className="text-center pt-20 text-gray-400">Kayıt bulunamadı.</div>;

  const canDecide = claim.status === "reviewed";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/insurer/claims" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" />Hasar Kayıtları
        </Link>
        <span className="text-gray-300">/</span>
        <span className="font-mono text-sm font-semibold text-gray-700">{claim.claim_number}</span>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColor(claim.status)}`}>
          {STATUS_LABELS[claim.status]}
        </span>
      </div>

      {/* İki sütun: ana içerik | rapor */}
      <div className="grid grid-cols-3 gap-6">

        {/* ── Sol: Ana içerik ────────────────────────────────────── */}
        <div className="col-span-2 space-y-4">

          {/* Poliçe + Konum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <Shield className="w-4 h-4" />Poliçe Bilgileri
              </div>
              {policy ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Poliçe No</span><span className="font-mono font-semibold">{policy.policy_number}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tür</span><span>{POLICY_TYPE_LABELS[policy.policy_type]} Sigortası</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Teminat</span><span className="font-bold text-gray-900">{formatCurrency(policy.coverage_amount)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Alan</span><span>{policy.property_area_m2} m²</span></div>
                </div>
              ) : <p className="text-sm text-gray-400">Poliçe bilgisi yüklenemedi.</p>}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3">
                <MapPin className="w-4 h-4" />Hasar Konumu
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Afet Türü</span><span>{DISASTER_TYPE_LABELS[claim.disaster_type] ?? claim.disaster_type}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Enlem</span><span className="font-mono">{claim.incident_lat.toFixed(5)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Boylam</span><span className="font-mono">{claim.incident_lon.toFixed(5)}</span></div>
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-gray-400 text-xs">{claim.created_at ? new Date(claim.created_at).toLocaleString("tr-TR") : "—"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Müşteri açıklaması */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <FileText className="w-4 h-4" />Müşteri Açıklaması
            </div>
            <p className="text-gray-800">{claim.description}</p>
          </div>

          {/* AI Analiz */}
          {claim.damage_score != null ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-5">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-gray-900">AI Hasar Analizi</span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full ml-auto">Çift Model Doğrulama</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-base">🛰️</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Uydu Analizi</span>
                    <span className="text-xs text-gray-400 ml-auto">xView2</span>
                  </div>
                  {claim.satellite_score != null ? (
                    <>
                      <div className="flex items-end gap-1 mb-2">
                        <span className={`text-3xl font-bold ${damageScoreColor(claim.satellite_score)}`}>{claim.satellite_score}</span>
                        <span className="text-sm text-gray-400 mb-1">/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div className={`h-2 rounded-full ${claim.satellite_score >= 75 ? "bg-red-500" : claim.satellite_score >= 50 ? "bg-orange-400" : claim.satellite_score >= 25 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${claim.satellite_score}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{claim.satellite_class ?? "—"}</span>
                        <span>%{claim.satellite_confidence} güven</span>
                      </div>
                    </>
                  ) : <span className="text-sm text-gray-400">Bekleniyor...</span>}
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <span className="text-base">🤖</span>
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Görsel Analiz</span>
                    <span className="text-xs text-blue-400 ml-auto">NVIDIA VLM</span>
                  </div>
                  {(() => {
                    const vlm = claim.vlm_score ?? claim.damage_score;
                    return <>
                      <div className="flex items-end gap-1 mb-2">
                        <span className={`text-3xl font-bold ${damageScoreColor(vlm)}`}>{vlm}</span>
                        <span className="text-sm text-blue-400 mb-1">/100</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                        <div className={`h-2 rounded-full ${vlm >= 75 ? "bg-red-500" : vlm >= 50 ? "bg-orange-400" : vlm >= 25 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${vlm}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-blue-600">
                        <span>{claim.damage_category ? DAMAGE_LABELS[claim.damage_category] : "—"}</span>
                        <span>%{claim.ai_confidence} güven</span>
                      </div>
                    </>;
                  })()}
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-80 mb-0.5">Birleşik Hasar Skoru</div>
                    <div className="text-xs opacity-60">NVIDIA VLM %70 · xView2 Uydu %30</div>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl font-bold">{claim.damage_score}</span>
                    <span className="text-sm opacity-70">/100</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                {[
                  { label: "Etkilenen Alan", value: `${claim.affected_area_m2} m²` },
                  { label: "Min. Onarım",    value: claim.estimated_min_cost ? formatCurrency(claim.estimated_min_cost) : "—" },
                  { label: "Max. Onarım",    value: claim.estimated_max_cost ? formatCurrency(claim.estimated_max_cost) : "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-sm font-bold text-gray-900">{value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>

              {claim.priority_level && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium mb-3 ${priorityColor(claim.priority_level)}`}>
                  <AlertTriangle className="w-4 h-4" />
                  Öncelik: {PRIORITY_LABELS[claim.priority_level]}
                  {claim.field_inspection_required === false && <span className="ml-auto text-xs font-normal">Saha ekibi gerekmiyor</span>}
                </div>
              )}

              {claim.ai_notes && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 italic">
                  "{claim.ai_notes}"
                </div>
              )}
            </div>
          ) : (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-center gap-3 text-blue-700">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              AI analizi devam ediyor... (xView2 uydu + NVIDIA VLM)
            </div>
          )}

          {/* Karar durumu */}
          {claim.status === "approved" && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Tazminat Onaylandı ve Ödeme Simüle Edildi</span>
              </div>
              <span className="text-xl font-bold text-green-700">{claim.approved_amount ? formatCurrency(claim.approved_amount) : ""}</span>
            </div>
          )}

          {claim.status === "rejected" && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Talep Reddedildi</span>
              </div>
              {claim.insurer_notes && <p className="text-sm text-red-600">{claim.insurer_notes}</p>}
            </div>
          )}

          {canDecide && (
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(true)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold transition">
                <XCircle className="w-5 h-5" />Reddet
              </button>
              <button onClick={() => setShowApproveModal(true)} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition">
                <CheckCircle className="w-5 h-5" />Onayla ve Öde
              </button>
            </div>
          )}
        </div>

        {/* ── Sağ: Ekspertiz Raporu PDF ──────────────────────────── */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-8">
            {/* Başlık */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Ekspertiz Raporu</span>
              </div>
              <button
                onClick={downloadReport}
                disabled={pdfLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#026C7C] text-white text-xs font-medium rounded-lg hover:bg-[#026C7C]/90 transition disabled:opacity-60"
              >
                {pdfLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                PDF İndir
              </button>
            </div>

            {/* İçerik */}
            {claim.expert_report ? (
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
                {/* Belge görünümü */}
                <div className="m-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50">
                    <div className="text-xs font-mono text-gray-400">{claim.claim_number}</div>
                    <div className="text-xs text-gray-400">{new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}</div>
                  </div>
                  <div className="p-5 text-sm text-gray-700 font-serif leading-relaxed whitespace-pre-wrap">
                    {claim.expert_report}
                  </div>
                </div>
                <p className="text-center text-xs text-gray-300 pb-3">Nemotron AI tarafından oluşturuldu</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <FileText className="w-10 h-10 text-gray-200 mb-3" />
                <p className="text-sm text-gray-400">Ekspertiz raporu henüz hazır değil.</p>
                <p className="text-xs text-gray-300 mt-1">AI analizi tamamlandıktan sonra oluşturulacak.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Onay Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tazminat Onayı</h3>
            <p className="text-sm text-gray-500 mb-4">Ödenecek tazminat tutarını girin. Ödeme simüle edilecektir.</p>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Tazminat Tutarı (TL)</label>
              <input type="number" value={approveAmount} onChange={(e) => setApproveAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              {claim.estimated_min_cost && claim.estimated_max_cost && (
                <p className="text-xs text-gray-400 mt-1">AI önerisi: {formatCurrency(claim.estimated_min_cost)} – {formatCurrency(claim.estimated_max_cost)}</p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">İptal</button>
              <button onClick={handleApprove} disabled={approving} className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}Onayla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Red Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Talebi Reddet</h3>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">Red Gerekçesi</label>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Müşteriye iletilecek red gerekçesi..." className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">İptal</button>
              <button onClick={handleReject} disabled={rejecting || !rejectNote} className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60">
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}Reddet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
