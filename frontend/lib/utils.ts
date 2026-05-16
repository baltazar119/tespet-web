export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

export const DISASTER_TYPE_LABELS: Record<string, string> = {
  deprem: "Deprem", sel: "Sel", yangin: "Yangın", dolu: "Dolu", heyelan: "Heyelan",
};

export const POLICY_TYPE_LABELS: Record<string, string> = {
  deprem: "Deprem", sel: "Sel", yangin: "Yangın", dolu: "Dolu", tarim: "Tarım", konut: "Konut",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Bekliyor", analyzing: "Analiz Ediliyor", reviewed: "İnceleme Bekliyor",
  approved: "Onaylandı", rejected: "Reddedildi", more_info: "Ek Bilgi İstendi",
};

export const PRIORITY_LABELS: Record<string, string> = {
  low: "Düşük", medium: "Orta", high: "Yüksek", critical: "Kritik",
};

export const DAMAGE_LABELS: Record<string, string> = {
  none: "Hasar Yok", minor: "Hafif Hasar", moderate: "Orta Hasar", severe: "Ağır Hasar", total: "Tam Hasar",
};

export function priorityColor(level: string): string {
  return { low: "bg-gray-100 text-gray-700", medium: "bg-yellow-100 text-yellow-700", high: "bg-orange-100 text-orange-700", critical: "bg-red-100 text-red-700" }[level] ?? "bg-gray-100 text-gray-700";
}

export function statusColor(status: string): string {
  return {
    pending: "bg-gray-100 text-gray-600",
    analyzing: "bg-blue-100 text-blue-700",
    reviewed: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    more_info: "bg-purple-100 text-purple-700",
  }[status] ?? "bg-gray-100 text-gray-600";
}

export function damageScoreColor(score: number): string {
  if (score >= 75) return "text-red-600";
  if (score >= 50) return "text-orange-500";
  if (score >= 25) return "text-yellow-500";
  return "text-green-600";
}
