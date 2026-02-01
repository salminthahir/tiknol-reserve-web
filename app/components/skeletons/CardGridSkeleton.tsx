import React from 'react';

export default function CardGridSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-6 lg:p-10 animate-pulse flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-6 mb-2">
                <div className="space-y-2">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                </div>
                <div className="h-12 w-40 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
            </div>

            {/* Search/Filter Bar */}
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] flex flex-col md:flex-row gap-4 mb-4">
                <div className="h-12 flex-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                <div className="h-12 w-24 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] p-6 flex flex-col gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-[#222]"></div>
                            <div className="space-y-2">
                                <div className="h-5 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                                <div className="h-3 w-20 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="h-3 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            <div className="h-3 w-3/4 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                        </div>
                        <div className="flex gap-2 mt-2">
                            <div className="flex-1 h-10 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                            <div className="flex-1 h-10 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
