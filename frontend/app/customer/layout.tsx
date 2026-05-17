"use client";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { FileText, AlertCircle, Bell, LogOut } from "lucide-react";
import { getClaims } from "@/lib/api";
import { STATUS_LABELS } from "@/lib/utils";

const NAV = [
  { href: "/customer/policies", icon: FileText,    label: "Poliçelerim" },
  { href: "/customer/claims",   icon: AlertCircle, label: "Hasar Kayıtlarım" },
];

function NotificationDropdown({ userId }: { userId: number }) {
  const [open, setOpen]   = useState(false);
  const [items, setItems] = useState<Array<{
    id: number; claim_number: string; status: string; created_at?: string;
  }>>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = `tespet_notif_seen_${userId}`;
    const lastSeen = localStorage.getItem(key) ?? new Date(Date.now() - 7 * 86400000).toISOString();

    getClaims()
      .then((claims) => {
        const cutoff = new Date(Date.now() - 7 * 86400000);
        const recent = claims.filter((c) => {
          const isNew = c.created_at && new Date(c.created_at) > new Date(lastSeen);
          const isResolved =
            (c.status === "approved" || c.status === "rejected") &&
            c.created_at && new Date(c.created_at) > cutoff;
          return isNew || isResolved;
        });
        setItems(recent.slice(0, 12));
        setUnread(recent.filter((c) => c.created_at && new Date(c.created_at) > new Date(lastSeen)).length);
      })
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      localStorage.setItem(`tespet_notif_seen_${userId}`, new Date().toISOString());
      setUnread(0);
    }
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-lg text-[#BBE5ED]/50 hover:text-[#BBE5ED] hover:bg-white/10 transition"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[1rem] h-4 bg-[#931F1D] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          <div className="px-4 py-3 bg-[#D8EEF2] flex items-center justify-between">
            <span className="font-semibold text-[#101329] text-sm">Bildirimler</span>
            {items.length > 0 && (
              <span className="text-xs bg-[#026C7C] text-white px-2 py-0.5 rounded-full font-medium">
                {items.length} bildirim
              </span>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                Yeni bildirim bulunmuyor
              </div>
            ) : (
              items.map((item) => (
                <Link
                  key={item.id}
                  href={`/customer/claims/${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 px-4 py-3 hover:bg-[#D8EEF2]/40 transition"
                >
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      item.status === "approved"
                        ? "bg-green-500"
                        : item.status === "rejected"
                        ? "bg-[#931F1D]"
                        : "bg-[#026C7C]"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{item.claim_number}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {STATUS_LABELS[item.status] ?? item.status}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-gray-100">
            <Link
              href="/customer/claims"
              onClick={() => setOpen(false)}
              className="text-xs text-[#026C7C] hover:underline font-medium"
            >
              Tüm hasar kayıtları →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!user || user.role !== "customer")) router.push("/login");
  }, [user, loading, router]);

  if (loading || !user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#101329]">
        <div className="w-8 h-8 border-4 border-[#026C7C] border-t-[#BBE5ED] rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#101329] sticky top-0 z-20 shadow-lg">
        <div className="flex items-stretch h-20 px-6 gap-4">

          <Link href="/customer/policies" className="flex items-center select-none mr-2 flex-shrink-0">
            <img src="/logo.png" alt="Tespet" className="h-12 w-auto object-contain brightness-0 invert" />
          </Link>

          <div className="w-px bg-white/10 my-3 mx-2" />

          <nav className="flex items-stretch flex-1">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex items-center gap-2.5 px-7 text-base font-semibold transition-all ${
                    active
                      ? "text-white bg-[#026C7C]/50 shadow-[inset_0_0_30px_rgba(2,108,124,0.35)]"
                      : "text-[#BBE5ED]/40 hover:text-[#BBE5ED] hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                  {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#BBE5ED]/60" />}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1">
            <NotificationDropdown userId={user.id} />

            <Link
              href="/customer/profile"
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition ${
                pathname === "/customer/profile" ? "bg-[#026C7C]" : "hover:bg-white/10"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-[#026C7C] border-2 border-[#BBE5ED]/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
              <span className="text-[#BBE5ED]/70 text-sm hidden lg:block">{user.full_name}</span>
            </Link>

            <button
              onClick={logout}
              title="Çıkış Yap"
              className="p-2 text-[#BBE5ED]/30 hover:text-[#931F1D] hover:bg-white/5 rounded-lg transition ml-1"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
