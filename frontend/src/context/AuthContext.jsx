import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("playmenu_user") || "null"));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("playmenu_token")));

  useEffect(() => {
    if (!localStorage.getItem("playmenu_token")) return setLoading(false);
    api.get("/auth/me").then(({ data }) => {
      setUser(data); localStorage.setItem("playmenu_user", JSON.stringify(data));
    }).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user, loading,
    login: async (email, password) => {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("playmenu_token", data.token);
      localStorage.setItem("playmenu_user", JSON.stringify(data.user));
      setUser(data.user);
      return data;
    },
    logout: () => {
      localStorage.removeItem("playmenu_token"); localStorage.removeItem("playmenu_user"); setUser(null);
    },
    refresh: async () => { const { data } = await api.get("/auth/me"); setUser(data); return data; },
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);