import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import axiosInstance from "../api/axiosInstance";

export type UserRole = "admin" | "manajerial";

interface AuthUser {
  id: number;
  username: string;
  display_name: string | null;
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Halaman awal masing-masing role setelah login berhasil
export const HOME_ROUTE_BY_ROLE: Record<UserRole, string> = {
  admin: "/",
  manajerial: "/executive-overview",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Cek status login saat aplikasi pertama kali dibuka (cookie belum tentu ada/valid)
  useEffect(() => {
    axiosInstance
      .get<AuthUser>("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(username: string, password: string): Promise<AuthUser> {
    const res = await axiosInstance.post<AuthUser>("/auth/login", { username, password });
    setUser(res.data);
    return res.data;
  }

  async function logout() {
    await axiosInstance.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}