import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { AuthUser } from "../types";
import { apiLogin } from "../api";

interface AuthContextType {
  token: string | null;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);
const TOKEN_KEY = "steakz.auth.token";
const USER_KEY  = "steakz.auth.user";

function readStored<T>(key: string): T | null {
  try {
    const val = localStorage.getItem(key);
    return val ? (JSON.parse(val) as T) : null;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Only restore session if the user is still in the same browser session
  const sessionActive = sessionStorage.getItem("steakz.session.active") === "true";

  const [token, setToken] = useState<string | null>(
    sessionActive ? localStorage.getItem(TOKEN_KEY) : null
  );
  const [user, setUser] = useState<AuthUser | null>(
    sessionActive ? readStored<AuthUser>(USER_KEY) : null
  );

  useEffect(() => {
    if (!sessionActive) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    sessionStorage.setItem("steakz.session.active", "true");
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem("steakz.session.active");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
