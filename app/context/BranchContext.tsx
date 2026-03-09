'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Branch {
    id: string;
    name: string;
    address?: string;
    code: string;
    latitude?: number;
    longitude?: number;
    maxRadius?: number;
}

export type LocationStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

interface BranchContextType {
    selectedBranch: Branch | null;
    setBranch: (branch: Branch) => void;
    isLoading: boolean;
    showSelector: boolean;
    setShowSelector: (show: boolean) => void;
    locationStatus: LocationStatus;
    nearestBranch: (Branch & { distanceKm: number }) | null;
    userLocation: { lat: number; lng: number } | null;
    detectNearestBranch: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);

    // New Geolocation State
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');
    const [nearestBranch, setNearestBranch] = useState<(Branch & { distanceKm: number }) | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    // Haversine formula to calculate distance between two points in km
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    const detectNearestBranch = async () => {
        setLocationStatus('requesting');

        try {
            // 1. Fetch all active branches
            const res = await fetch('/api/branches');
            if (!res.ok) throw new Error('Failed to fetch branches');
            const branches: Branch[] = await res.json();

            if (branches.length === 0) {
                setLocationStatus('unavailable');
                setShowSelector(true);
                return;
            }

            // 2. Request Geolocation
            if (!navigator.geolocation) {
                setLocationStatus('unavailable');
                setShowSelector(true);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocationStatus('granted');
                    const { latitude, longitude } = position.coords;
                    setUserLocation({ lat: latitude, lng: longitude });

                    // 3. Find Nearest Branch
                    let nearest: (Branch & { distanceKm: number }) | null = null;
                    let minDistance = Infinity;

                    branches.forEach(branch => {
                        if (branch.latitude && branch.longitude) {
                            const distance = calculateDistance(latitude, longitude, branch.latitude, branch.longitude);
                            if (distance < minDistance) {
                                minDistance = distance;
                                nearest = { ...branch, distanceKm: distance };
                            }
                        }
                    });

                    if (nearest) {
                        setNearestBranch(nearest);
                        setBranch(nearest); // Auto-select nearest
                    } else {
                        // Fallback if no branches have coordinates
                        setShowSelector(true);
                    }
                },
                (error) => {
                    console.warn('Geolocation error:', error);
                    setLocationStatus('denied');
                    setShowSelector(true); // Fallback to manual selection
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );

        } catch (error) {
            console.error('Detection error:', error);
            setLocationStatus('unavailable');
            setShowSelector(true);
        }
    };

    // Load from localStorage on mount (With Expiration Logic)
    useEffect(() => {
        const saved = localStorage.getItem('titiknol_branch');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);

                // Check if it's the new format with timestamp
                if (parsed && typeof parsed === 'object' && 'timestamp' in parsed && 'branch' in parsed) {
                    const { branch, timestamp } = parsed;
                    const EXPIRATION_TIME = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

                    if (Date.now() - timestamp > EXPIRATION_TIME) {
                        // Expired
                        console.log("Saved branch expired. Will ask for location on menu page.");
                        localStorage.removeItem('titiknol_branch');
                        // DO NOT auto-detect here anymore
                    } else {
                        // Valid & Not expired
                        setSelectedBranch(branch);
                    }
                } else {
                    // Backward compatibility: Old format (just branch object) or something else
                    // Treat it as valid for now, but the next time it's saved it will get a timestamp
                    setSelectedBranch(parsed);
                }
            } catch (e) {
                console.error("Failed to parse saved branch", e);
                localStorage.removeItem('titiknol_branch');
                // DO NOT auto-detect here anymore
            }
        } else {
            // No branch selected, DO NOT auto-detect here anymore
            // Wait for user to interact on the /menu page
            console.log("No saved branch. Waiting for user interaction to request location.");
        }
        setIsLoading(false);
    }, []);

    const setBranch = (branch: Branch) => {
        setSelectedBranch(branch);
        // Save to localStorage with current timestamp for 6-hour expiration
        localStorage.setItem('titiknol_branch', JSON.stringify({
            branch,
            timestamp: Date.now()
        }));
        setShowSelector(false);
    };

    return (
        <BranchContext.Provider value={{
            selectedBranch,
            setBranch,
            isLoading,
            showSelector,
            setShowSelector,
            locationStatus,
            nearestBranch,
            userLocation,
            detectNearestBranch
        }}>
            {children}
        </BranchContext.Provider>
    );
}

export function useBranch() {
    const context = useContext(BranchContext);
    if (context === undefined) {
        throw new Error('useBranch must be used within a BranchProvider');
    }
    return context;
}
