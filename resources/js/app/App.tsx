import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router";
import axios from 'axios';
import { AuthContext } from "../contexts/AuthContext";

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
          if (window.location.pathname !== '/admin/login' && window.location.pathname.startsWith('/admin')) {
            window.location.href = '/admin/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Fetch initial user if on admin routes
    if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
      axios.get('/api/admin/user').then(res => {
        if (res.data && res.data.user) {
          setUser(res.data.user);
          
          // Apply settings if exist
          if (res.data.user.settings) {
            const settings = res.data.user.settings;
            // Theme
            if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
              setDarkMode(true);
            } else {
              setDarkMode(false);
            }
            // Font size
            if (settings.font_size) {
              document.documentElement.classList.remove('text-sm', 'text-base', 'text-lg');
              document.documentElement.classList.add(`text-${settings.font_size}`);
            }
          }
        }
      }).catch(err => {
        // Will be caught by interceptor if 401
      });
    }

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
    <AuthContext.Provider value={{ user, setUser }}>
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
    </AuthContext.Provider>
  );
}
