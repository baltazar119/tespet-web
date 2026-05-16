"use client";
import { useEffect, useState } from "react";
import { getAnalytics, type Analytics } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Clock, TrendingDown, Shield, CheckCircle, XCircle, AlertCircle, Zap } from "lucide-react";

const PIE_COLORS = ["#22c55e", "#f59e0b", "#f97316", "#ef4444", "#8b5cf6"];
const CATEGORY_LABELS: Record<string, string> = {
  none: "Hasar Yok", minor: "Hafif", moderate: "Orta", severe: "Ağır", total: "Tam",
};
const TYPE_LABELS: Record<string, string> = {
  deprem: "Deprem", sel: "Sel", yangin: "Yangın", dolu: "Dolu", heyelan: "Heyelan",
};

function StatCard({ icon: Icon, label, value, sub, color = "text-gray-900" }: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center gap-2 text-gray-500 text-sm mb-2"><Icon className="w-4 h-4" />{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => { getAnalytics().then(setData); }, []);

  if (!data) return <div className="flex justify-center pt-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;

  const categoryData = Object.entries(data.damage_categories).map(([k, v]) => ({
    name: CATEGORY_LABELS[k] ?? k, value: v,
  }));

  const typeData = Object.entries(data.disaster_types).map(([k, v]) => ({
    name: TYPE_LABELS[k] ?? k, value: v,
  }));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analitik Dashboard</h1>
        <p className="text-gray-500 mt-0.5">AI çalışma verimliliği ve hasar istatistikleri</p>
      </div>

      {/* KPI'lar */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={Clock} label="Ort. Değerlendirme" value={`${data.avg_processing_minutes} dk`} sub={`Sektör: ${data.industry_avg_days} gün`} color="text-blue-600" />
        <StatCard icon={Zap} label="AI Otomasyon Oranı" value={`%${data.ai_auto_rate}`} sub="Otomatik sonuçlanan" color="text-green-600" />
        <StatCard icon={TrendingDown} label="Saha Ziyareti Tasarrufu" value={data.no_field_needed} sub={`${formatCurrency(data.field_savings_tl)} tasarruf`} color="text-orange-600" />
        <StatCard icon={Shield} label="Toplam Poliçe" value={data.total_policies} sub={`${data.total_claims} hasar kaydı`} />
      </div>

      {/* İkinci sıra */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard icon={AlertCircle} label="İnceleme Bekleyen" value={data.reviewed + data.pending} color="text-yellow-600" />
        <StatCard icon={CheckCircle} label="Onaylanan" value={data.approved} sub={formatCurrency(data.total_approved_amount)} color="text-green-600" />
        <StatCard icon={XCircle} label="Reddedilen" value={data.rejected} color="text-red-500" />
        <StatCard icon={TrendingDown} label="Ort. Hasar Skoru" value={`${data.avg_damage_score}/100`} color={data.avg_damage_score > 60 ? "text-red-600" : "text-orange-500"} />
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Haftalık başvuru */}
        <div className="col-span-2 bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Haftalık Hasar Başvuruları</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.weekly_claims} barCategoryGap="35%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
              <Bar dataKey="count" name="Başvuru" fill="#3b82f6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Durum dağılımı */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Kayıt Durumları</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie
                data={[
                  { name: "Onaylanan", value: data.approved },
                  { name: "Bekleyen", value: data.reviewed },
                  { name: "Reddedilen", value: data.rejected },
                  { name: "Analiz", value: data.pending },
                ]}
                cx="50%" cy="50%" outerRadius={70} dataKey="value"
              >
                {["#22c55e", "#f59e0b", "#ef4444", "#3b82f6"].map((color, i) => (
                  <Cell key={i} fill={color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Hasar kategorisi dağılımı */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Hasar Kategorisi Dağılımı</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={categoryData} layout="vertical" barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} />
              <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} width={60} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13 }} />
              <Bar dataKey="value" name="Kayıt" radius={[0, 6, 6, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Afet türü dağılımı */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Afet Türüne Göre Kayıtlar</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} %${((percent ?? 0) * 100).toFixed(0)}`} labelLine={false}>
                {typeData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Sektör karşılaştırması */}
      <div className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white">
        <h3 className="font-semibold text-lg mb-4">Tespet vs. Sektör Ortalaması</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "Değerlendirme Süresi", tespet: `${data.avg_processing_minutes} dakika`, sector: `${data.industry_avg_days} gün`, better: true },
            { label: "Saha Ekibi İhtiyacı", tespet: `${data.no_field_needed} ziyaret iptal`, sector: "Tüm ziyaretler manuel", better: true },
            { label: "Otomasyon Oranı", tespet: `%${data.ai_auto_rate}`, sector: "%0", better: true },
          ].map((item) => (
            <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="text-blue-200 text-xs mb-2">{item.label}</div>
              <div className="text-xl font-bold mb-1">{item.tespet}</div>
              <div className="text-blue-300 text-xs">Sektör: {item.sector}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
