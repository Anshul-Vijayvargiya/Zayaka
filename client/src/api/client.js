import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("zayka_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function errMsg(error) {
  if (typeof error === "string") return error;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message === "Network Error") {
    return "Cannot connect to Zayka server. Please ensure the backend server is running on http://localhost:5000.";
  }
  if (error?.message) return error.message;
  return "An unexpected error occurred. Please try again.";
}

export default api;
