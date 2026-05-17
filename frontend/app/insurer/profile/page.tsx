"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "@/lib/api";
import { User, Shield, Bell, Camera, CheckCircle, AlertCircle, Smartphone, Mail, ToggleLeft, ToggleRight } from "lucide-react";

const SECTION_NAV = [
  { key: "profile",       icon: User,   label: "Profil Bilgileri" },
  { key: "security",      icon: Shield, label: "Güvenlik" },
  { key: "notifications", icon: Bell,   label: "Bildirimler" },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-[#026C7C]" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  const nameParts = (user?.full_name ?? "").split(" ");
  const [firstName,   setFirstName]   = useState(nameParts[0] ?? "");
  const [lastName,    setLastName]    = useState(nameParts.slice(1).join(" ") ?? "");
  const [email,       setEmail]       = useState(user?.email ?? "");
  const [company,     setCompany]     = useState(user?.company_name ?? "");
  const [phone,       setPhone]       = useState("");
  const [newPass,     setNewPass]     = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  // Güvenlik — 2FA
  const [twoFaEnabled,   setTwoFaEnabled]   = useState(false);
  const [twoFaMethod,    setTwoFaMethod]    = useState<"phone" | "email">("email");
  const [twoFaPhone,     setTwoFaPhone]     = useState("");
  const [twoFaEmail,     setTwoFaEmail]     = useState(user?.email ?? "");
  const [twoFaSaved,     setTwoFaSaved]     = useState(false);

  // Bildirimler
  const [notifNewPolicy,     setNotifNewPolicy]     = useState(true);
  const [notifUpdatedPolicy, setNotifUpdatedPolicy] = useState(true);
  const [notifEmail,         setNotifEmail]         = useState(true);
  const [notifBrowser,       setNotifBrowser]       = useState(false);
  const [notifSaved,         setNotifSaved]         = useState(false);

  const [section,  setSection]  = useState<"profile" | "security" | "notifications">("profile");
  const [saving,   setSaving]   = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  async function handleSave() {
    if (newPass && newPass !== confirmPass) {
      setFeedback({ ok: false, msg: "Şifreler eşleşmiyor." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      await updateProfile({
        full_name:    `${firstName} ${lastName}`.trim(),
        email,
        company_name: company,
        phone:        phone || undefined,
        password:     newPass || undefined,
      });
      await refreshUser();
      setFeedback({ ok: true, msg: "Bilgiler başarıyla güncellendi." });
      setNewPass("");
      setConfirmPass("");
    } catch (e: unknown) {
      setFeedback({ ok: false, msg: e instanceof Error ? e.message : "Kayıt sırasında bir hata oluştu." });
    } finally {
      setSaving(false);
    }
  }

  function handleSaveSecurity() {
    setTwoFaSaved(true);
    setTimeout(() => setTwoFaSaved(false), 3000);
  }

  function handleSaveNotifications() {
    const key = `tespet_notif_prefs_${user?.id}`;
    localStorage.setItem(key, JSON.stringify({ notifNewPolicy, notifUpdatedPolicy, notifEmail, notifBrowser }));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 3000);
  }

  const initials =
    `${firstName[0] ?? ""}${lastName[0] ?? ""}`.toUpperCase() ||
    (user?.full_name?.[0]?.toUpperCase() ?? "U");

  const inputCls =
    "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:border-[#026C7C] focus:ring-2 focus:ring-[#026C7C]/15 transition placeholder:text-gray-300";
  const labelCls =
    "block text-xs font-semibold text-gray-500 mb-1.5 tracking-wide uppercase";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex gap-5">

        {/* ── Sol panel ─────────────────────────────────────────── */}
        <div className="w-52 flex-shrink-0 space-y-3">

          {/* Avatar kartı */}
          <div className="bg-[#101329] rounded-2xl p-4 text-center">
            <div className="relative inline-block">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#026C7C] border-4 border-[#BBE5ED]/20 flex items-center justify-center text-white text-2xl font-black">
                {initials}
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 bg-[#BBE5ED] rounded-full flex items-center justify-center hover:bg-white transition">
                <Camera className="w-3 h-3 text-[#026C7C]" />
              </button>
            </div>
            <div className="text-white font-semibold text-sm mt-2.5 leading-snug">
              {`${firstName} ${lastName}`.trim() || user?.full_name}
            </div>
            <div className="text-[#BBE5ED]/50 text-xs mt-0.5">{company || user?.company_name}</div>
            <div className="text-[#BBE5ED]/30 text-[11px] mt-1 truncate px-1">{email || user?.email}</div>
          </div>

          {/* Navigasyon */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {SECTION_NAV.map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setSection(key as typeof section)}
                className={`w-full flex items-center gap-2.5 px-4 py-3 border-b last:border-0 text-sm transition ${
                  section === key
                    ? "bg-[#D8EEF2] text-[#026C7C] font-semibold"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Sağ form ──────────────────────────────────────────── */}
        <div className="flex-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">

            {/* ── Profil Bilgileri ── */}
            {section === "profile" && (
              <>
                <h2 className="text-base font-bold text-[#101329] mb-5">Profil Bilgileri</h2>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={labelCls}>Ad</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Adınız" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Soyad</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Soyadınız" className={inputCls} />
                  </div>
                </div>

                <div className="mb-4">
                  <label className={labelCls}>E-posta</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@sirket.com" className={inputCls} />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className={labelCls}>Şirket Adı</label>
                    <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Şirket adı" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Telefon</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+90 5xx xxx xx xx" className={inputCls} />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-5 mb-5">
                  <h3 className="text-sm font-bold text-[#101329] mb-4">Şifre Değiştir</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Yeni Şifre</label>
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="••••••••" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Şifre Tekrar</label>
                      <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder="••••••••" className={inputCls} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Şifreyi değiştirmek istemiyorsanız boş bırakın.</p>
                </div>

                {feedback && (
                  <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4 ${feedback.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-[#931F1D] border border-red-200"}`}>
                    {feedback.ok ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {feedback.msg}
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                  <button
                    onClick={() => {
                      const parts = (user?.full_name ?? "").split(" ");
                      setFirstName(parts[0] ?? ""); setLastName(parts.slice(1).join(" ") ?? "");
                      setEmail(user?.email ?? ""); setCompany(user?.company_name ?? "");
                      setPhone(""); setNewPass(""); setConfirmPass(""); setFeedback(null);
                    }}
                    className="px-5 py-2.5 border border-[#026C7C] text-[#026C7C] rounded-xl text-sm font-medium hover:bg-[#D8EEF2] transition"
                  >
                    İptal
                  </button>
                  <button onClick={handleSave} disabled={saving} className="px-6 py-2.5 bg-[#026C7C] text-white rounded-xl text-sm font-semibold hover:bg-[#026C7C]/90 disabled:opacity-60 transition shadow-sm">
                    {saving ? "Kaydediliyor…" : "Kaydet"}
                  </button>
                </div>
              </>
            )}

            {/* ── Güvenlik ── */}
            {section === "security" && (
              <>
                <h2 className="text-base font-bold text-[#101329] mb-5">Güvenlik</h2>

                {/* 2FA toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 mb-5">
                  <div>
                    <div className="text-sm font-semibold text-gray-800">İki Aşamalı Doğrulama</div>
                    <div className="text-xs text-gray-400 mt-0.5">Hesabınıza ekstra güvenlik katmanı ekleyin</div>
                  </div>
                  <Toggle enabled={twoFaEnabled} onToggle={() => setTwoFaEnabled(!twoFaEnabled)} />
                </div>

                {twoFaEnabled && (
                  <div className="border border-[#BBE5ED] rounded-xl p-5 bg-[#D8EEF2]/30 mb-5 space-y-4">
                    <p className="text-xs font-semibold text-[#026C7C] uppercase tracking-wide">Doğrulama Yöntemi</p>

                    {/* Yöntem seçimi */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setTwoFaMethod("email")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition flex-1 justify-center ${
                          twoFaMethod === "email"
                            ? "bg-[#026C7C] text-white border-[#026C7C]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#026C7C]"
                        }`}
                      >
                        <Mail className="w-4 h-4" /> E-posta
                      </button>
                      <button
                        onClick={() => setTwoFaMethod("phone")}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition flex-1 justify-center ${
                          twoFaMethod === "phone"
                            ? "bg-[#026C7C] text-white border-[#026C7C]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#026C7C]"
                        }`}
                      >
                        <Smartphone className="w-4 h-4" /> Telefon (SMS)
                      </button>
                    </div>

                    {/* E-posta alanı */}
                    {twoFaMethod === "email" && (
                      <div>
                        <label className={labelCls}>Doğrulama E-postası</label>
                        <input
                          type="email"
                          value={twoFaEmail}
                          onChange={(e) => setTwoFaEmail(e.target.value)}
                          placeholder="dogrulama@sirket.com"
                          className={inputCls}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Giriş yapıldığında bu adrese doğrulama kodu gönderilecek.</p>
                      </div>
                    )}

                    {/* Telefon alanı */}
                    {twoFaMethod === "phone" && (
                      <div>
                        <label className={labelCls}>Cep Telefonu Numarası</label>
                        <input
                          type="tel"
                          value={twoFaPhone}
                          onChange={(e) => setTwoFaPhone(e.target.value)}
                          placeholder="+90 5xx xxx xx xx"
                          className={inputCls}
                        />
                        <p className="text-xs text-gray-400 mt-1.5">Giriş yapıldığında bu numaraya SMS ile kod gönderilecek.</p>
                      </div>
                    )}
                  </div>
                )}

                {twoFaSaved && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4 bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-4 h-4" /> Güvenlik ayarları kaydedildi.
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button onClick={handleSaveSecurity} className="px-6 py-2.5 bg-[#026C7C] text-white rounded-xl text-sm font-semibold hover:bg-[#026C7C]/90 transition shadow-sm">
                    Kaydet
                  </button>
                </div>
              </>
            )}

            {/* ── Bildirimler ── */}
            {section === "notifications" && (
              <>
                <h2 className="text-base font-bold text-[#101329] mb-5">Bildirim Ayarları</h2>

                {/* Bildirim türleri */}
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bildirim Türleri</p>

                  {[
                    {
                      label: "Yeni Poliçe Bildirimleri",
                      desc: "Sisteme yeni bir poliçe eklendiğinde bildirim al",
                      value: notifNewPolicy,
                      set: setNotifNewPolicy,
                    },
                    {
                      label: "Güncellenen Poliçe Bildirimleri",
                      desc: "Mevcut bir poliçenin durumu değiştiğinde bildirim al",
                      value: notifUpdatedPolicy,
                      set: setNotifUpdatedPolicy,
                    },
                  ].map(({ label, desc, value, set }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                      </div>
                      <Toggle enabled={value} onToggle={() => set(!value)} />
                    </div>
                  ))}
                </div>

                {/* Bildirim kanalları */}
                <div className="space-y-3 mb-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Bildirim Kanalları</p>

                  {[
                    {
                      label: "E-posta Bildirimleri",
                      desc: "Bildirimleri e-posta olarak al",
                      value: notifEmail,
                      set: setNotifEmail,
                    },
                    {
                      label: "Tarayıcı Bildirimleri",
                      desc: "Anlık tarayıcı (push) bildirimi al",
                      value: notifBrowser,
                      set: setNotifBrowser,
                    },
                  ].map(({ label, desc, value, set }) => (
                    <div key={label} className="flex items-center justify-between p-4 rounded-xl border border-gray-200">
                      <div>
                        <div className="text-sm font-medium text-gray-800">{label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{desc}</div>
                      </div>
                      <Toggle enabled={value} onToggle={() => set(!value)} />
                    </div>
                  ))}
                </div>

                {notifSaved && (
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm mb-4 bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-4 h-4" /> Bildirim tercihleri kaydedildi.
                  </div>
                )}

                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                  <button onClick={handleSaveNotifications} className="px-6 py-2.5 bg-[#026C7C] text-white rounded-xl text-sm font-semibold hover:bg-[#026C7C]/90 transition shadow-sm">
                    Kaydet
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
