import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import axios from 'axios';

import PublicMapPage from "../pages/PublicMapPage";
import LoginPage from "../pages/LoginPage";
import AdminLayout from "../components/layout/AdminLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Authentication is handled via Laravel Session & Axios interceptors.
  // Unauthenticated users navigating directly will hit Laravel's auth middleware first,
  // except for client-side routing where the next API call will 401 and redirect them.
  return <>{children}</>;
}

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Setup axios for session cookies
    axios.defaults.withCredentials = true;

    // Axios interceptor to catch 401 Unauthorized or 419 CSRF Token Mismatch
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && (error.response.status === 401 || error.response.status === 419)) {
          // If we are not already on the login page, redirect
          if (window.location.pathname !== '/admin/login') {
            window.location.href = '/admin/login';
          }
        }
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <Routes>
      <Route path="/" element={<PublicMapPage />} />
      <Route path="/admin/login" element={
        <LoginPage setUser={setUser} />
      } />
      <Route path="/admin/*" element={
        <ProtectedRoute>
          <AdminLayout darkMode={darkMode} setDarkMode={setDarkMode} setUser={setUser} />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
