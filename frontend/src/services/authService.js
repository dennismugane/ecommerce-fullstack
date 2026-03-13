// src/services/authService.js
// NOTE: Axios interceptors are registered in App.jsx — NOT here.
// This file only handles token storage and auth API calls.

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ── Token helpers ──────────────────────────────────
export const getToken   = () => localStorage.getItem("token");
export const getUser    = () => JSON.parse(localStorage.getItem("user") || "null");
export const isLoggedIn = () => !!localStorage.getItem("token");

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};

const saveAuth = (data) => {
  localStorage.setItem("token", data.token);
  localStorage.setItem("user", JSON.stringify({ email: data.email, role: data.role }));
};

// ── Auth API calls ─────────────────────────────────
export const register = async (email, password) => {
  // Use plain axios with no auth header for register/login
  const response = await axios.post(`${BASE_URL}/api/auth/register`, { email, password });
  saveAuth(response.data);
  return response.data;
};

export const login = async (email, password) => {
  const response = await axios.post(`${BASE_URL}/api/auth/login`, { email, password });
  saveAuth(response.data);
  return response.data;
};
