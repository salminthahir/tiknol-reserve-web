import React from 'react';

export default function TableSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-6 lg:p-10 animate-pulse flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-2">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                    <div className="h-4 w-48 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                </div>
                <div className="h-12 w-32 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] flex flex-col md:flex-row gap-4">
                <div className="h-12 flex-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                <div className="h-12 w-48 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
            </div>

            {/* Table/List Area */}
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] overflow-hidden">
                {/* Table Header */}
                <div className="h-12 border-b border-gray-100 dark:border-[#222] bg-gray-50 dark:bg-[#151515]"></div>

                {/* Rows */}
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="p-4 border-b border-gray-100 dark:border-[#222] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-[#222]"></div>
                            <div className="space-y-1">
                                <div className="h-4 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                                <div className="h-3 w-20 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            </div>
                        </div>
                        <div className="hidden md:block h-6 w-24 bg-gray-100 dark:bg-[#1A1A1A] rounded-full"></div>
                        <div className="hidden md:block h-4 w-32 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                        <div className="h-8 w-8 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
