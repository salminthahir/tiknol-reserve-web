// app/login/page.tsx
'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Setup Client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg('Login Gagal: Email atau Password salah.');
      setLoading(false);
    } else {
      // SECURITY UPGRADE: Panggil API buat set Secure Cookie (HttpOnly)
      try {
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: data.user.email,
            userId: data.user.id,
            role: 'STAFF'
          })
        });

        // Login Sukses -> Lempar ke POS System
        router.push('/admin/pos');
      } catch (err) {
        setErrorMsg('Gagal membuat sesi aman.');
        setLoading(false);
      }
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
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Email ID</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-gray-700 p-3 text-white focus:border-[#FBC02D] focus:outline-none transition-colors"
              placeholder="name@titiknol.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-gray-700 p-3 text-white focus:border-[#FBC02D] focus:outline-none transition-colors"
              placeholder="••••••••"
            />
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