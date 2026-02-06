// app/(auth)/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [employeeId, setEmployeeId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const response = await fetch('/api/auth/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: employeeId.toUpperCase() })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.message || 'Login gagal. Periksa Employee ID Anda.');
        setLoading(false);
        return;
      }

      // Login Sukses -> Redirect ke POS
      router.push('/admin/pos');
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 text-white font-sans">
      <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333] p-8 shadow-2xl relative">

        {/* Dekorasi Aksen Kuning */}
        <div className="absolute top-0 left-0 w-full h-1 bg-[#FBC02D]"></div>

        <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Staff Access</h1>
        <p className="text-gray-500 text-sm mb-8">TITIK NOL COFFEE RESERVE</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Employee ID</label>
            <input
              type="text"
              required
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
              className="w-full bg-black border border-gray-700 p-3 text-white focus:border-[#FBC02D] focus:outline-none transition-colors uppercase"
              placeholder="EMP-001"
            />
            <p className="text-xs text-gray-600 mt-1">Masukkan ID karyawan Anda</p>
          </div>

          {errorMsg && (
            <div className="bg-red-900/50 border border-red-500 p-3 text-red-200 text-sm text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FBC02D] text-black font-bold py-4 uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Login to Dashboard'}
          </button>
        </form>
      </div>
    </div>
  );
}
