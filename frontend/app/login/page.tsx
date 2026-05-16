"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Sol panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex-col justify-between p-12 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">tespet</span>
        </div>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Hasar tespitini<br />dakikalara indirin.
          </h1>
          <p className="text-blue-200 text-lg leading-relaxed mb-8">
            Uydu görüntüsü + yapay zeka analizi ile sigorta hasarlarını saha ekibi göndermeden değerlendirin.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: "4.2 dk", label: "Ortalama değerlendirme" },
              { value: "%89", label: "AI güven oranı" },
              { value: "18 gün", label: "Sektör ortalaması" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold">{s.value}</div>
                <div className="text-blue-200 text-sm mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-blue-300 text-sm">
          Türksat &amp; NVIDIA altyapısıyla çalışır
        </p>
      </div>

      {/* Sağ panel — login formu */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="w-7 h-7 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">tespet</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Giriş Yap</h2>
          <p className="text-gray-500 mb-8">Hesap türünüze göre otomatik yönlendirileceksiniz.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="ornek@sirket.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Şifre</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Giriş yapılıyor...</> : "Giriş Yap"}
            </button>
          </form>

          {/* Demo hesaplar */}
          <div className="mt-8 border-t pt-6">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">Demo Hesaplar</p>
            <div className="space-y-2">
              {[
                { label: "Sigorta Şirketi", email: "demo@anadolusigorta.com", pass: "demo1234" },
                { label: "Müşteri", email: "ahmet.celik@gmail.com", pass: "demo1234" },
              ].map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                  className="w-full text-left px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition group"
                >
                  <span className="text-xs font-semibold text-blue-600 group-hover:text-blue-700">{d.label}</span>
                  <p className="text-sm text-gray-600 mt-0.5">{d.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
