'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Branch {
    id: string;
    name: string;
    address?: string;
    code: string;
}

interface BranchContextType {
    selectedBranch: Branch | null;
    setBranch: (branch: Branch) => void;
    isLoading: boolean;
    showSelector: boolean;
    setShowSelector: (show: boolean) => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showSelector, setShowSelector] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('titiknol_branch');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSelectedBranch(parsed);
            } catch (e) {
                console.error("Failed to parse saved branch", e);
                localStorage.removeItem('titiknol_branch');
            }
        } else {
            // No branch selected, show selector
            setShowSelector(true);
        }
        setIsLoading(false);
    }, []);

    const setBranch = (branch: Branch) => {
        setSelectedBranch(branch);
        localStorage.setItem('titiknol_branch', JSON.stringify(branch));
        setShowSelector(false);
    };

    return (
        <BranchContext.Provider value={{ selectedBranch, setBranch, isLoading, showSelector, setShowSelector }}>
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
