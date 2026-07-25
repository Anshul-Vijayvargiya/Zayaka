import React, { createContext, useContext, useState, useEffect } from "react";
import api, { errMsg } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("zayka_token") || null);
  const [user, setUser] = useState(() => {
    const cached = localStorage.getItem("zayka_user");
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem("zayka_user", JSON.stringify(res.data.user));
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const saveAuth = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem("zayka_token", newToken);
    localStorage.setItem("zayka_user", JSON.stringify(newUser));
  };

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      saveAuth(res.data.token, res.data.user);
      return res.data;
    } catch (err) {
      throw new Error(errMsg(err));
    }
  };

  const register = async (data) => {
    try {
      const res = await api.post("/auth/register", data);
      return res.data;
    } catch (err) {
      throw new Error(errMsg(err));
    }
  };

  const verifyOtp = async (email, code) => {
    try {
      const res = await api.post("/auth/verify-otp", { email, code });
      saveAuth(res.data.token, res.data.user);
      return res.data;
    } catch (err) {
      throw new Error(errMsg(err));
    }
  };

  const resendOtp = async (email) => {
    try {
      const res = await api.post("/auth/resend-otp", { email });
      return res.data;
    } catch (err) {
      throw new Error(errMsg(err));
    }
  };

  const googleLogin = async (credential) => {
    try {
      const res = await api.post("/auth/google", { credential });
      saveAuth(res.data.token, res.data.user);
      return res.data;
    } catch (err) {
      throw new Error(errMsg(err));
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("zayka_token");
    localStorage.removeItem("zayka_user");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        register,
        verifyOtp,
        resendOtp,
        googleLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
