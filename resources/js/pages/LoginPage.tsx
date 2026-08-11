import { useState } from "react";
import axios from 'axios';
import { useNavigate } from "react-router";
import { Building2 } from "lucide-react";
import { Card, Btn, InputField } from "../components/ui";

export default function LoginPage({ setUser }: { setUser: (user: any) => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: any) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Optional: get CSRF cookie first (Laravel 8+ Sanctum feature, but works for web too)
    axios.get('/sanctum/csrf-cookie').then(() => {
      axios.post('/api/admin/login', { email, password })
        .then(res => {
          setUser(res.data.user);
          navigate('/admin/dashboard');
        })
        .catch(err => {
          setError(err.response?.data?.message || "Login gagal. Periksa email dan password.");
          setLoading(false);
        });
    }).catch(err => {
      setError("Gagal terhubung ke server.");
      setLoading(false);
    });
  };
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl" padding="p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={24} className="text-[#2E7D32]" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Map Perizinan</h1>
          <p className="text-sm text-gray-500 mt-1">Silakan masuk ke akun Anda</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <InputField label="Email" type="email" required value={email} onChange={(e: any) => setEmail(e.target.value)} placeholder="admin@pemkab.go.id" />
          <InputField label="Password" type="password" required value={password} onChange={(e: any) => setPassword(e.target.value)} placeholder="••••••••" />

          <Btn variant="primary" className="w-full justify-center mt-2" disabled={loading} type="submit">
            {loading ? "Memproses..." : "Masuk"}
          </Btn>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400">
          Gunakan email admin (misal: andi.k@pemkab.go.id) dan password 'password'
        </div>
      </Card>
    </div>
  );
}
