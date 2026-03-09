'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { useBranch } from '@/app/context/BranchContext';

export interface Branch {
    id: string;
    name: string;
    address?: string;
    code: string;
    latitude?: number;
    longitude?: number;
    maxRadius?: number;
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

    // Consume context for geolocation features
    const { locationStatus, nearestBranch, userLocation, detectNearestBranch } = useBranch();

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

    // Calculate distance for a display branch if userLocation is available
    const getDistanceDisplay = (branch: Branch) => {
        if (!userLocation || !branch.latitude || !branch.longitude) return null;

        // If it's the strictly nearest branch
        if (nearestBranch && nearestBranch.id === branch.id) {
            return (
                <span className="ml-2 text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-mono flex items-center gap-1">
                    <MapPin size={10} /> {nearestBranch.distanceKm.toFixed(1)} km
                </span>
            );
        }

        // Just calculate distance to show
        const R = 6371;
        const dLat = (branch.latitude - userLocation.lat) * (Math.PI / 180);
        const dLon = (branch.longitude - userLocation.lng) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(userLocation.lat * (Math.PI / 180)) * Math.cos(branch.latitude * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const distance = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));

        return (
            <span className="ml-2 text-[10px] text-zinc-500 font-mono">
                {distance.toFixed(1)} km
            </span>
        );
    };

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
                            <>
                                {locationStatus === 'denied' && (
                                    <div className="px-4 py-2 border-b border-zinc-800 bg-zinc-800/50 flex items-center justify-between">
                                        <span className="text-xs text-zinc-400">Akses lokasi ditolak</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                detectNearestBranch();
                                            }}
                                            className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-400/10 px-2 py-1 rounded"
                                        >
                                            <Navigation size={12} /> Coba Lagi
                                        </button>
                                    </div>
                                )}
                                {locationStatus === 'requesting' && (
                                    <div className="px-4 py-2 border-b border-zinc-800 bg-emerald-900/10">
                                        <span className="text-xs text-emerald-400 animate-pulse flex items-center gap-2">
                                            <Navigation size={12} className="animate-spin" /> Mencari lokasi terdekat...
                                        </span>
                                    </div>
                                )}

                                {branches.map(branch => (
                                    <button
                                        key={branch.id}
                                        onClick={() => {
                                            onSelect(branch);
                                            setIsOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0 ${currentBranchId === branch.id ? 'bg-emerald-900/20 text-emerald-400' : 'text-zinc-300'
                                            }`}
                                    >
                                        <div className="font-semibold text-sm flex items-center justify-between">
                                            <span>{branch.name}</span>
                                            {getDistanceDisplay(branch)}
                                        </div>
                                        {branch.address && (
                                            <div className="text-xs text-zinc-500 truncate mt-1">{branch.address}</div>
                                        )}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
