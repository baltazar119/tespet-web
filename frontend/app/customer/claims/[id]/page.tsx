"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getClaim, getPolicy, downloadClaimReport,
  type Claim, type Policy,
} from "@/lib/api";
import {
  STATUS_LABELS, statusColor, DAMAGE_LABELS, DISASTER_TYPE_LABELS,
  PRIORITY_LABELS, priorityColor, damageScoreColor, formatCurrency,
} from "@/lib/utils";
import {
  ChevronLeft, Download, Brain, Satellite, FileText, Shield,
  MapPin, Clock, CheckCircle, XCircle, Loader2, AlertTriangle,
  RefreshCw,
} from "lucide-react";

const POLLING_STATUSES = new Set(["pending", "analyzing"]);

export default function CustomerClaimDetailPage() {
  const { id } = useParams();
  const claimId = Number(id);

  const [claim,  setClaim]  = useState<Claim | null>(null);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchClaim = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const c = await getClaim(claimId);
      setClaim(c);
      setLastRefresh(new Date());
      if (c.policy_id && !policy) {
        const p = await getPolicy(c.policy_id).catch(() => null);
        setPolicy(p);
      }
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [claimId, policy]);

  // İlk yükleme
  useEffect(() => { fetchClaim(true); }, [claimId]);

  // Polling — pending/analyzing iken 6 sn'de bir yenile
  useEffect(() => {
    if (!claim || !POLLING_STATUSES.has(claim.status)) return;
    const t = setInterval(() => fetchClaim(false), 6000);
    return () => clearInterval(t);
  }, [claim?.status, fetchClaim]);

  async function handleDownload() {
    setPdfLoading(true);
    try {
      await downloadClaimReport(claimId);
    } catch {
      alert("PDF oluşturulurken hata oluştu. Lütfen tekrar deneyin.");
    } finally {
      setPdfLoading(false);
    }
  }

  // ── Yükleniyor ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <div className="w-8 h-8 border-4 border-[#026C7C] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-400">Hasar kaydı yükleniyor…</p>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 mb-4">Hasar kaydı bulunamadı.</p>
        <Link href="/customer/claims" className="text-[#026C7C] hover:underline text-sm">
          ← Hasar Kayıtlarıma Dön
        </Link>
      </div>
    );
  }

  const isAnalyzing = POLLING_STATUSES.has(claim.status);
  const hasAI       = claim.damage_score != null;
  const isFinished  = claim.status === "approved" || claim.status === "rejected";

  return (
    <div className="max-w-4xl mx-auto space-y-5">

      {/* ── Breadcrumb ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customer/claims"
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#026C7C] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            Hasar Kayıtlarım
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-mono text-sm font-semibold text-gray-700">{claim.claim_number}</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${statusColor(claim.status)}`}>
            {STATUS_LABELS[claim.status] ?? claim.status}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && isAnalyzing && (
            <span className="text-xs text-gray-400">
              Son güncelleme: {lastRefresh.toLocaleTimeString("tr-TR")}
            </span>
          )}
          <button
            onClick={() => fetchClaim(false)}
            className="p-2 text-gray-400 hover:text-[#026C7C] hover:bg-[#D8EEF2]/50 rounded-lg transition"
            title="Yenile"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Analiz Durumu Banneri ────────────────────────────────────── */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
          <div className="relative flex-shrink-0">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <div>
            <p className="text-blue-800 font-semibold text-sm">
              {claim.status === "pending" ? "Analiz kuyruğunda bekleniyor…" : "Yapay Zeka Analizi Devam Ediyor…"}
            </p>
            <p className="text-blue-600 text-xs mt-0.5">
              xView2 uydu modeli + NVIDIA Llama 3.2 Vision çalışıyor. Ortalama süre: 40–60 saniye.
            </p>
          </div>
          <span className="ml-auto flex items-center gap-1 text-xs text-blue-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Otomatik güncelleniyor
          </span>
        </div>
      )}

      {/* ── Onay / Red Sonucu ───────────────────────────────────────── */}
      {claim.status === "approved" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-green-800">Tazminat Onaylandı</p>
              {claim.insurer_notes && (
                <p className="text-green-600 text-sm mt-0.5">{claim.insurer_notes}</p>
              )}
            </div>
          </div>
          {claim.approved_amount && (
            <div className="text-right">
              <p className="text-xs text-green-500 mb-0.5">Ödenen Tutar</p>
              <p className="text-2xl font-black text-green-700">{formatCurrency(claim.approved_amount)}</p>
            </div>
          )}
        </div>
      )}

      {claim.status === "rejected" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-3">
          <XCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Tazminat Talebi Reddedildi</p>
            {claim.insurer_notes && (
              <p className="text-red-600 text-sm mt-1">{claim.insurer_notes}</p>
            )}
          </div>
        </div>
      )}

      {/* ── İki Sütun ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-5">

        {/* Sol — Bilgiler + AI */}
        <div className="col-span-2 space-y-4">

          {/* Poliçe + Konum */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3 font-medium">
                <Shield className="w-4 h-4" /> Poliçe Bilgileri
              </div>
              {policy ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Poliçe No</span>
                    <span className="font-mono font-semibold text-gray-800">{policy.policy_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tür</span>
                    <span className="text-gray-800">{policy.policy_type} Sigortası</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teminat</span>
                    <span className="font-bold text-gray-900">{formatCurrency(policy.coverage_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Adres</span>
                    <span className="text-gray-800 text-right text-xs max-w-[140px]">{policy.property_address}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400">Poliçe yükleniyor…</p>
              )}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-3 font-medium">
                <MapPin className="w-4 h-4" /> Olay Bilgileri
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Afet Türü</span>
                  <span className="text-gray-800">{DISASTER_TYPE_LABELS[claim.disaster_type] ?? claim.disaster_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Konum</span>
                  <span className="font-mono text-xs text-gray-700">
                    {claim.incident_lat.toFixed(4)}, {claim.incident_lon.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400 pt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-xs">
                    {claim.created_at
                      ? new Date(claim.created_at).toLocaleString("tr-TR")
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Başvuru açıklaması */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2 font-medium">
              <FileText className="w-4 h-4" /> Başvuru Açıklamanız
            </div>
            <p className="text-gray-800 text-sm leading-relaxed">{claim.description}</p>
          </div>

          {/* AI Analiz Sonuçları */}
          {hasAI ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#026C7C]" />
                <span className="font-semibold text-gray-900">Yapay Zeka Analiz Sonuçları</span>
                <span className="ml-auto text-xs bg-[#D8EEF2] text-[#026C7C] px-2 py-0.5 rounded-full font-medium">
                  Çift Model Doğrulama
                </span>
              </div>

              {/* İki model skoru */}
              <div className="grid grid-cols-2 gap-3">
                {/* xView2 */}
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Satellite className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Uydu Analizi</span>
                    <span className="text-[10px] text-gray-400 ml-auto bg-gray-200 px-1.5 py-0.5 rounded">xView2</span>
                  </div>
                  {claim.satellite_score != null ? (
                    <>
                      <div className="flex items-end gap-1 mb-2">
                        <span className={`text-3xl font-bold ${damageScoreColor(claim.satellite_score)}`}>
                          {claim.satellite_score}
                        </span>
                        <span className="text-sm text-gray-400 mb-1">/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            claim.satellite_score >= 75 ? "bg-red-500"
                            : claim.satellite_score >= 50 ? "bg-orange-400"
                            : claim.satellite_score >= 25 ? "bg-yellow-400"
                            : "bg-green-400"
                          }`}
                          style={{ width: `${claim.satellite_score}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{claim.satellite_class ?? "—"}</span>
                        <span>%{claim.satellite_confidence} güven</span>
                      </div>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400">Bekleniyor…</span>
                  )}
                </div>

                {/* NVIDIA VLM */}
                <div className="bg-[#D8EEF2]/30 border border-[#BBE5ED]/60 rounded-xl p-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Brain className="w-4 h-4 text-[#026C7C]" />
                    <span className="text-xs font-semibold text-[#026C7C] uppercase tracking-wide">Görsel AI</span>
                    <span className="text-[10px] text-[#026C7C]/60 ml-auto bg-[#BBE5ED]/40 px-1.5 py-0.5 rounded">NVIDIA VLM</span>
                  </div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className={`text-3xl font-bold ${damageScoreColor(claim.damage_score!)}`}>
                      {claim.damage_score}
                    </span>
                    <span className="text-sm text-[#026C7C]/60 mb-1">/100</span>
                  </div>
                  <div className="w-full bg-[#BBE5ED]/40 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${
                        claim.damage_score! >= 75 ? "bg-red-500"
                        : claim.damage_score! >= 50 ? "bg-orange-400"
                        : claim.damage_score! >= 25 ? "bg-yellow-400"
                        : "bg-green-400"
                      }`}
                      style={{ width: `${claim.damage_score}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-[#026C7C]/70">
                    <span>{claim.damage_category ? DAMAGE_LABELS[claim.damage_category] : "—"}</span>
                    <span>%{claim.ai_confidence} güven</span>
                  </div>
                </div>
              </div>

              {/* Birleşik skor */}
              <div className="bg-[#101329] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-[#BBE5ED]/60 text-xs mb-0.5">Birleşik Hasar Skoru</p>
                  <p className="text-[#BBE5ED]/40 text-[10px]">Uydu (xView2) %30 · NVIDIA VLM %70</p>
                </div>
                <div className="flex items-end gap-1">
                  <span className={`text-4xl font-black ${damageScoreColor(claim.damage_score!)}`}>
                    {claim.damage_score}
                  </span>
                  <span className="text-[#BBE5ED]/40 text-sm mb-1">/100</span>
                </div>
              </div>

              {/* Detay istatistikler */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Hasar Kategorisi", value: claim.damage_category ? DAMAGE_LABELS[claim.damage_category] : "—" },
                  { label: "Etkilenen Alan",   value: claim.affected_area_m2 ? `${claim.affected_area_m2} m²` : "—" },
                  { label: "Tahmini Min.",      value: claim.estimated_min_cost ? formatCurrency(claim.estimated_min_cost) : "—" },
                  { label: "Tahmini Max.",      value: claim.estimated_max_cost ? formatCurrency(claim.estimated_max_cost) : "—" },
                  { label: "AI Güven Oranı",   value: claim.ai_confidence ? `%${claim.ai_confidence}` : "—" },
                  { label: "Saha Ekibi",        value: claim.field_inspection_required ? "Gerekli" : "Gerekmiyor" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                    <p className="text-sm font-bold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>

              {/* Öncelik */}
              {claim.priority_level && (
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium ${priorityColor(claim.priority_level)}`}>
                  <AlertTriangle className="w-4 h-4" />
                  Öncelik Seviyesi: {PRIORITY_LABELS[claim.priority_level]}
                </div>
              )}

              {/* AI notu */}
              {claim.ai_notes && (
                <div className="bg-[#D8EEF2]/40 border border-[#BBE5ED] rounded-lg p-4">
                  <p className="text-xs font-semibold text-[#026C7C] mb-1">Yapay Zeka Değerlendirmesi</p>
                  <p className="text-sm text-gray-700 leading-relaxed italic">"{claim.ai_notes}"</p>
                </div>
              )}
            </div>
          ) : !isAnalyzing ? (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
              AI analiz sonuçları henüz mevcut değil.
            </div>
          ) : null}
        </div>

        {/* Sağ — Ekspertiz Raporu */}
        <div className="col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden sticky top-6">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-semibold text-gray-700">Ekspertiz Raporu</span>
              </div>
              {claim.expert_report && (
                <button
                  onClick={handleDownload}
                  disabled={pdfLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#026C7C] text-white text-xs font-medium rounded-lg hover:bg-[#015f6b] transition disabled:opacity-60"
                >
                  {pdfLoading
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Download className="w-3.5 h-3.5" />}
                  PDF İndir
                </button>
              )}
            </div>

            {claim.expert_report ? (
              <div className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
                <div className="m-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                  <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100">
                    <p className="text-[10px] font-mono text-gray-400">{claim.claim_number}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-serif">
                    {claim.expert_report}
                  </div>
                </div>
                <p className="text-center text-[10px] text-gray-300 pb-3">Nemotron AI · Tespet Ekspertiz Sistemi</p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center gap-3">
                <div className="w-6 h-6 border-2 border-[#026C7C] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400">Rapor hazırlanıyor…</p>
                <p className="text-xs text-gray-300">Analiz tamamlandıktan sonra otomatik güncellenecek.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-5 text-center gap-2">
                <FileText className="w-8 h-8 text-gray-200" />
                <p className="text-sm text-gray-400">Rapor henüz oluşturulmadı.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
