"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { login as apiLogin, getMe } from "@/lib/api";
import { useRouter } from "next/navigation";

interface AuthUser {
  id: number;
  email: string;
  full_name: string;
  role: "customer" | "insurer";
  company_name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("tespet_token");
    if (!token) { setLoading(false); return; }
    getMe()
      .then((u) => setUser(u as AuthUser))
      .catch(() => localStorage.removeItem("tespet_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const res = await apiLogin(email, password);
    localStorage.setItem("tespet_token", res.access_token);
    const me = await getMe();
    setUser(me as AuthUser);
    if (me.role === "insurer") router.push("/insurer/disasters");
    else router.push("/customer/policies");
  }

  function logout() {
    localStorage.removeItem("tespet_token");
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
