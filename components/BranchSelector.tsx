'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

export interface Branch {
    id: string;
    name: string;
    address?: string;
    code: string;
}

interface BranchSelectorProps {
    currentBranchId: string | null;
    onSelect: (branch: Branch) => void;
    className?: string; // Add className to props interface
}

export default function BranchSelector({ currentBranchId, onSelect, className = '' }: BranchSelectorProps) { // Use className
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        fetch('/api/branches')
            .then(res => res.json())
            .then(data => {
                setBranches(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch branches', err);
                setLoading(false);
            });
    }, []);

    const selectedBranch = branches.find(b => b.id === currentBranchId);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/20 transition-all font-outfit"
            >
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span className="truncate max-w-[150px]">
                    {selectedBranch ? selectedBranch.name : 'Pilih Lokasi'}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-20">
                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-4 text-center text-zinc-500">Loading...</div>
                        ) : branches.length === 0 ? (
                            <div className="p-4 text-center text-zinc-500">Tidak ada cabang aktif</div>
                        ) : (
                            branches.map(branch => (
                                <button
                                    key={branch.id}
                                    onClick={() => {
                                        onSelect(branch);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0 ${currentBranchId === branch.id ? 'bg-emerald-900/20 text-emerald-400' : 'text-zinc-300'
                                        }`}
                                >
                                    <div className="font-semibold text-sm">{branch.name}</div>
                                    {branch.address && (
                                        <div className="text-xs text-zinc-500 truncate">{branch.address}</div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
