'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Key, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SuperAdminLoginPage() {
    const router = useRouter();
    const [pin, setPin] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/super-admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });

            if (res.ok) {
                router.push('/super-admin/dashboard');
            } else {
                const data = await res.json();
                setError(data.message || 'Access Denied');
                setLoading(false);
            }
        } catch (err) {
            setError('System Error. Try again.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 relative overflow-hidden font-sans">

            {/* Background Accents */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#FFBF00]/5 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#222]/50 rounded-full blur-[80px] pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm relative z-10"
            >
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#111] border border-[#222] rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-[#FFBF00]/10">
                        <Shield className="text-[#FFBF00]" size={32} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">SUPER <span className="text-[#FFBF00]">ADMIN</span></h1>
                    <p className="text-gray-500 text-sm font-medium">Restricted Access // Mainframe</p>
                </div>

                <div className="bg-[#111] border border-[#222] rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Decorative top line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#FFBF00] to-transparent opacity-50"></div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Security PIN</label>
                            <div className="relative">
                                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="password"
                                    required
                                    autoFocus
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                                    placeholder="••••••"
                                    className="w-full bg-[#0A0A0A] border border-[#333] text-center text-2xl font-black tracking-[0.5em] py-4 rounded-xl focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all placeholder-gray-800 text-white"
                                />
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-xs font-bold text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || pin.length < 4}
                            className="w-full bg-[#FFBF00] text-black font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-[#F2B600] active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-[0_4px_20px_rgba(255,191,0,0.2)]"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <>AUTHENTICATE <ArrowRight size={18} /></>}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[10px] text-gray-600 font-mono mt-8 uppercase tracking-widest">
                    Titik Nol Reserve &copy; 2024
                </p>

            </motion.div>
        </div>
    );
}
