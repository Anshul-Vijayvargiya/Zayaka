import React, { createContext, useContext, useState, useEffect } from "react";
import api, { errMsg } from "../api/client";

const AuthContext = createContext(null);

// A stray literal "undefined" string (or corrupt JSON) in localStorage must
// never crash the app on boot — fall back to null instead of throwing.
function safeGetToken(key) {
  const raw = localStorage.getItem(key);
  return raw && raw !== "undefined" && raw !== "null" ? raw : null;
}

function safeGetJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw && raw !== "undefined" ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  if (value === undefined || value === null) return;
  localStorage.setItem(key, value);
}

function safeSetJSON(key, value) {
  if (value === undefined || value === null) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota/serialization errors — worst case, the cache misses
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => safeGetToken("zayka_token"));
  const [user, setUser] = useState(() => safeGetJSON("zayka_user"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api
        .get("/auth/me")
        .then((res) => {
          setUser(res.data.user);
          safeSetJSON("zayka_user", res.data.user);
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
    safeSetItem("zayka_token", newToken);
    safeSetJSON("zayka_user", newUser);
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
