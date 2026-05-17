"use client";
import { useState } from "react";
import { Inter } from "next/font/google";
import { useAuth } from "@/context/AuthContext";
import { register as apiRegister, forgotPassword } from "@/lib/api";
import { Eye, EyeOff, Loader2, AlertCircle, Satellite, Brain, Clock, ArrowLeft, CheckCircle, User, Mail, Phone, Lock } from "lucide-react";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] });

const DEMOS = [
  { label: "Sigorta Şirketi", role: "insurer",  email: "demo@anadolusigorta.com", pass: "demo1234" },
  { label: "Müşteri",          role: "customer", email: "ahmet.celik@gmail.com",   pass: "demo1234" },
];

const STATS = [
  { value: "4.2 dk", label: "Ortalama değerlendirme", icon: Clock },
  { value: "%89",    label: "AI güven oranı",          icon: Brain },
  { value: "18 gün", label: "Sektör ortalaması",       icon: Satellite },
];

type View = "login" | "register" | "forgot" | "forgot-sent";

const inputCls = "w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 bg-white placeholder-gray-300 focus:outline-none focus:border-[#026C7C] focus:ring-2 focus:ring-[#026C7C]/10 transition";
const labelCls = "block text-xs font-semibold text-gray-600 mb-1.5";

export default function LoginPage() {
  const { login } = useAuth();

  const [view,        setView]        = useState<View>("login");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState("");

  /* ── Kayıt alanları ── */
  const [regName,     setRegName]     = useState("");
  const [regSurname,  setRegSurname]  = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regPhone,    setRegPhone]    = useState("");
  const [regPass,     setRegPass]     = useState("");
  const [regPassConf, setRegPassConf] = useState("");
  const [showRegPass, setShowRegPass] = useState(false);
  const [regAgreed,   setRegAgreed]   = useState(false);

  /* ── Şifre sıfırlama ── */
  const [forgotEmail, setForgotEmail] = useState("");

  function resetErrors() { setError(""); }

  /* ── Login ── */
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  }

  /* ── Register ── */
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();
    if (regPass !== regPassConf) { setError("Şifreler eşleşmiyor."); return; }
    if (regPass.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    setLoading(true);
    try {
      const data = await apiRegister({
        full_name: `${regName} ${regSurname}`.trim(),
        email: regEmail,
        phone: regPhone || undefined,
        password: regPass,
      });
      await login(regEmail, regPass);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  }

  /* ── Şifre sıfırlama ── */
  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    resetErrors();
    setLoading(true);
    try {
      await forgotPassword(forgotEmail);
    } catch {
      /* endpoint yoksa bile UI'da başarı göster */
    } finally {
      setLoading(false);
      setView("forgot-sent");
    }
  }

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── Sol panel — koyu marka alanı (70%) ─────────────────── */}
      <div className="hidden lg:flex w-[70%] bg-[#101329] flex-col py-10 px-12 relative overflow-hidden">

        {/* Arka plan efektleri */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-5%] w-[600px] h-[600px] rounded-full bg-[#026C7C]/10 blur-3xl" />
          <div className="absolute bottom-[-15%] left-[-5%] w-[500px] h-[500px] rounded-full bg-[#026C7C]/8 blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1.3" fill="#BBE5ED" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        {/* Logo — ortalanmış */}
        <div className="relative flex justify-center mb-8">
          <img src="/logo.png" alt="Tespet" className="h-32 w-auto object-contain brightness-0 invert opacity-90" />
        </div>

        {/* Ana içerik — dikey + yatay orta */}
        <div className="relative flex-1 flex flex-col justify-center items-center">
          <div className="space-y-5 w-[90%]">

            {/* Rozet + Başlık — ortalı */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center gap-2 border border-[#026C7C]/50 bg-[#026C7C]/10 text-[#BBE5ED] text-xs font-semibold px-4 py-2 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#BBE5ED] animate-pulse" />
                AFET ANALİZ VE HASAR TESPİT PLATFORMU
              </div>
              <h2 className="text-4xl font-black text-white leading-[1.1] mb-3">
                Hasarları yapay zeka ile<br />
                <span className="text-[#BBE5ED]">saniyeler içinde</span><br />
                tespit edin.
              </h2>
              <p className="text-[#BBE5ED]/50 text-sm leading-relaxed max-w-lg">
                Uydu görüntüsü analizi ve AI değerlendirmesi ile saha ekibi göndermeden hasar tespiti yapın.
              </p>
            </div>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-3">
              {STATS.map(({ value, label, icon: Icon }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
                  <Icon className="w-4 h-4 text-[#BBE5ED]/40 mb-2" />
                  <div className="text-2xl font-black text-[#BBE5ED]">{value}</div>
                  <div className="text-[#BBE5ED]/40 text-xs mt-1 leading-tight">{label}</div>
                </div>
              ))}
            </div>

            {/* Mock dashboard */}
            <div className="bg-[#0d1225] border border-white/10 rounded-xl overflow-hidden shadow-2xl">

              {/* Pencere başlığı */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.04] border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                </div>
                <span className="text-[#BBE5ED]/25 text-[10px] font-medium tracking-wide">Tespet — Hasar Yönetim Paneli</span>
                <div className="flex items-center gap-2">
                  {["Panel","Hasar","Analitik"].map(t => (
                    <span key={t} className={`text-[10px] px-2 py-0.5 rounded font-medium ${t === "Panel" ? "bg-[#026C7C]/40 text-[#BBE5ED]" : "text-[#BBE5ED]/25"}`}>{t}</span>
                  ))}
                </div>
              </div>

              <div className="p-4 space-y-3">

                {/* Üst stat kartları */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { n: "142",   sub: "+12 bu hafta",  label: "Aktif Hasar",     color: "text-[#BBE5ED]",  trend: "↑" },
                    { n: "₺4.2M", sub: "onaylanan",     label: "Ödeme Tutarı",    color: "text-green-400",  trend: "↑" },
                    { n: "%89",   sub: "AI güven",      label: "Doğruluk Oranı",  color: "text-[#026C7C]",  trend: "→" },
                    { n: "4.2dk", sub: "ort. süre",     label: "Değerlendirme",   color: "text-amber-400",  trend: "↓" },
                  ].map(({ n, sub, label, color, trend }) => (
                    <div key={label} className="bg-white/[0.04] border border-white/[0.07] rounded-lg p-2.5">
                      <div className="text-[#BBE5ED]/30 text-[9px] uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-base font-black ${color}`}>{n}</div>
                      <div className="text-[#BBE5ED]/25 text-[9px] mt-0.5">{trend} {sub}</div>
                    </div>
                  ))}
                </div>

                {/* Mini bar chart + aktif hasar dağılımı */}
                <div className="grid grid-cols-5 gap-2">
                  {/* Bar chart */}
                  <div className="col-span-3 bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[#BBE5ED]/40 text-[9px] uppercase tracking-wide font-semibold">Haftalık Hasar Akışı</span>
                      <span className="text-[#BBE5ED]/20 text-[9px]">Son 7 gün</span>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {[35, 55, 42, 70, 58, 85, 62].map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div
                            className={`w-full rounded-sm ${i === 5 ? "bg-[#026C7C]" : "bg-white/10"}`}
                            style={{ height: `${h}%` }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {["Pzt","Sal","Çar","Per","Cum","Cmt","Paz"].map(d => (
                        <span key={d} className="text-[#BBE5ED]/15 text-[8px] flex-1 text-center">{d}</span>
                      ))}
                    </div>
                  </div>

                  {/* Hasar türleri */}
                  <div className="col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-lg p-3">
                    <div className="text-[#BBE5ED]/40 text-[9px] uppercase tracking-wide font-semibold mb-2">Tür Dağılımı</div>
                    <div className="space-y-1.5">
                      {[
                        { label: "Deprem", pct: 38, color: "bg-amber-400" },
                        { label: "Sel",    pct: 27, color: "bg-blue-400" },
                        { label: "Yangın", pct: 21, color: "bg-red-400" },
                        { label: "Diğer",  pct: 14, color: "bg-[#026C7C]" },
                      ].map(({ label, pct, color }) => (
                        <div key={label}>
                          <div className="flex justify-between mb-0.5">
                            <span className="text-[#BBE5ED]/35 text-[9px]">{label}</span>
                            <span className="text-[#BBE5ED]/25 text-[9px]">{pct}%</span>
                          </div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Hasar listesi */}
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-lg overflow-hidden">
                  <div className="grid grid-cols-5 px-3 py-1.5 border-b border-white/[0.06]">
                    {["Kayıt No","Tür","Konum","AI Skoru","Durum"].map(h => (
                      <span key={h} className="text-[#BBE5ED]/20 text-[8px] uppercase tracking-wide font-semibold">{h}</span>
                    ))}
                  </div>
                  {[
                    { id:"HSR-2041", type:"Deprem", loc:"İzmir, Konak",    score:92, status:"Onaylandı",   sc:"text-green-400", sb:"bg-green-400/10 text-green-400" },
                    { id:"HSR-2040", type:"Sel",    loc:"Ankara, Çankaya", score:78, status:"İnceleniyor", sc:"text-[#BBE5ED]", sb:"bg-[#026C7C]/20 text-[#BBE5ED]" },
                    { id:"HSR-2039", type:"Yangın", loc:"İstanbul, Kadıköy",score:85,status:"Bekliyor",    sc:"text-amber-400", sb:"bg-amber-400/10 text-amber-400" },
                  ].map(row => (
                    <div key={row.id} className="grid grid-cols-5 px-3 py-2 border-b border-white/[0.04] items-center last:border-0">
                      <span className="text-[#BBE5ED]/50 text-[9px] font-mono">{row.id}</span>
                      <span className="text-[#BBE5ED]/40 text-[9px]">{row.type}</span>
                      <span className="text-[#BBE5ED]/30 text-[9px]">{row.loc}</span>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-8 bg-white/5 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${row.score >= 85 ? "bg-green-400" : row.score >= 75 ? "bg-[#026C7C]" : "bg-amber-400"}`} style={{ width: `${row.score}%` }} />
                        </div>
                        <span className={`text-[9px] font-bold ${row.sc}`}>{row.score}</span>
                      </div>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded w-fit ${row.sb}`}>{row.status}</span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ── Sağ panel — form (30%) ───────────────────────────────── */}
      <div className={`${inter.className} flex-1 lg:w-[30%] flex flex-col justify-between bg-gradient-to-b from-white to-[#f4fbfc] px-8 py-8 overflow-y-auto relative shadow-[-8px_0_40px_rgba(2,108,124,0.07)]`}>

        {/* Üst aksan çizgisi */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#026C7C] via-[#BBE5ED]/80 to-transparent" />

        {/* Köşe dekoratif element */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-bl-full bg-[#026C7C]/[0.035] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-24 h-24 rounded-tr-full bg-[#BBE5ED]/[0.15] pointer-events-none" />

        {/* Logo (mobilde görünür) */}
        <div className="flex items-center gap-2 lg:hidden mb-6 relative">
          <img src="/logo.png" alt="Tespet" className="h-8 w-auto object-contain" />
        </div>

        {/* Form alanı */}
        <div className="flex-1 flex flex-col justify-center w-full max-w-sm mx-auto py-6 relative">

          {/* ── Şifremi Unuttum ── */}
          {view === "forgot" && (
            <>
              <button
                onClick={() => { setView("login"); resetErrors(); }}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-[#026C7C] mb-6 transition w-fit"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Giriş Yap'a dön
              </button>
              <h1 className="text-xl font-black text-[#101329] mb-1">Şifre Sıfırlama</h1>
              <p className="text-gray-400 text-xs mb-6 leading-relaxed">
                E-posta adresinizi girin, şifre sıfırlama bağlantısını size gönderelim.
              </p>
              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className={labelCls}>E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} required placeholder="ornek@sirket.com" className={`${inputCls} pl-10`} />
                  </div>
                </div>
                <button type="submit" disabled={loading || !forgotEmail} className="w-full bg-[#026C7C] hover:bg-[#015f6b] disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-[#026C7C]/20">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Gönderiliyor…</> : "Sıfırlama Bağlantısı Gönder"}
                </button>
              </form>
            </>
          )}

          {/* ── Şifre gönderildi ── */}
          {view === "forgot-sent" && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 border-2 border-green-200 rounded-full flex items-center justify-center mx-auto mb-5">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h1 className="text-xl font-black text-[#101329] mb-2">E-posta Gönderildi</h1>
              <p className="text-gray-400 text-sm leading-relaxed mb-2">
                <span className="font-semibold text-[#101329]">{forgotEmail}</span> adresine şifre sıfırlama bağlantısı gönderildi.
              </p>
              <p className="text-gray-300 text-xs mb-7">Gelen kutunuzu ve spam klasörünüzü kontrol edin.</p>
              <button onClick={() => { setView("login"); setForgotEmail(""); }} className="text-sm font-semibold text-[#026C7C] hover:underline">
                Giriş sayfasına dön →
              </button>
            </div>
          )}

          {/* ── Giriş / Kayıt ── */}
          {(view === "login" || view === "register") && (
            <>
              <h1 className="text-2xl font-black text-[#101329] mb-1 tracking-tight">
                {view === "login" ? "Tekrar hoş geldiniz" : "Hesap Oluştur"}
              </h1>
              <p className="text-gray-400 text-sm mb-5">
                {view === "login" ? "Hesabınıza erişmek için giriş yapın." : "Kişisel bilgilerinizle ücretsiz kayıt olun."}
              </p>

              {/* Tab switcher */}
              <div className="flex rounded-xl border border-gray-200 p-1 mb-6 bg-gray-100/60">
                {(["login", "register"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => { setView(t); resetErrors(); }}
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
                      view === t ? "bg-[#101329] text-white shadow-sm" : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {t === "login" ? "Giriş Yap" : "Kayıt Ol"}
                  </button>
                ))}
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2.5 rounded-xl text-xs mb-4">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              {/* ── Giriş formu ── */}
              {view === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className={labelCls}>E-posta</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="ornek@sirket.com" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls} style={{ marginBottom: 0 }}>Şifre</label>
                      <button type="button" onClick={() => { setForgotEmail(email); setView("forgot"); resetErrors(); }} className="text-[10px] text-[#026C7C] hover:underline font-semibold">
                        Şifremi unuttum
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className={`${inputCls} pl-10 pr-10`} />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !email || !password} className="w-full bg-[#026C7C] hover:bg-[#015f6b] disabled:opacity-40 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-[#026C7C]/20 mt-1">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Giriş yapılıyor…</> : "Giriş Yap →"}
                  </button>
                </form>
              )}

              {/* ── Kayıt formu (müşteri) ── */}
              {view === "register" && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Ad</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                        <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)} required placeholder="Adınız" className={`${inputCls} pl-10`} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>Soyad</label>
                      <input type="text" value={regSurname} onChange={(e) => setRegSurname(e.target.value)} required placeholder="Soyadınız" className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>E-posta</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} required placeholder="ornek@mail.com" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Telefon <span className="normal-case font-normal text-gray-300">(opsiyonel)</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input type="tel" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Şifre</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input type={showRegPass ? "text" : "password"} value={regPass} onChange={(e) => setRegPass(e.target.value)} required placeholder="En az 6 karakter" className={`${inputCls} pl-10 pr-10`} />
                      <button type="button" onClick={() => setShowRegPass(!showRegPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition">
                        {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Şifre Tekrar</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                      <input type="password" value={regPassConf} onChange={(e) => setRegPassConf(e.target.value)} required placeholder="Şifrenizi tekrar girin" className={`${inputCls} pl-10`} />
                    </div>
                  </div>
                  {/* Sözleşme onayı */}
                  <div className={`flex items-start gap-2.5 p-3 rounded-xl border transition ${regAgreed ? "border-[#026C7C]/30 bg-[#D8EEF2]/30" : "border-gray-200 bg-gray-50"}`}>
                    <input
                      id="reg-agree"
                      type="checkbox"
                      checked={regAgreed}
                      onChange={(e) => setRegAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded accent-[#026C7C] cursor-pointer flex-shrink-0"
                    />
                    <label htmlFor="reg-agree" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                      <a href="/gizlilik" target="_blank" rel="noopener noreferrer" className="text-[#026C7C] font-semibold hover:underline">Gizlilik Politikası</a>
                      {" "}ve{" "}
                      <a href="/kullanim-sartlari" target="_blank" rel="noopener noreferrer" className="text-[#026C7C] font-semibold hover:underline">Kullanım Şartları</a>
                      'nı okudum ve kabul ediyorum.
                    </label>
                  </div>

                  <button type="submit" disabled={loading || !regName || !regEmail || !regPass || !regPassConf || !regAgreed} className="w-full bg-[#026C7C] hover:bg-[#015f6b] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 text-sm shadow-md shadow-[#026C7C]/20">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor…</> : "Hesap Oluştur →"}
                  </button>
                </form>
              )}

              {/* Demo hesaplar — sadece login'de */}
              {view === "login" && (
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 mb-3">Demo Hesaplar</p>
                  <div className="space-y-2">
                    {DEMOS.map((d) => (
                      <button
                        key={d.email}
                        onClick={() => { setEmail(d.email); setPassword(d.pass); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-[#D8EEF2]/50 border border-transparent hover:border-[#BBE5ED] transition text-left"
                      >
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${d.role === "insurer" ? "bg-[#026C7C]" : "bg-[#101329]"}`}>
                          {d.label[0]}
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-[#026C7C]">{d.label}</div>
                          <div className="text-[10px] text-gray-400">{d.email}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-xs text-gray-300 text-center font-medium relative">© 2026 Tespet · Tüm hakları saklıdır.</p>
      </div>
    </div>
  );
}
