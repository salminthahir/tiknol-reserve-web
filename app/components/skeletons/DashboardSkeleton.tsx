import React from 'react';

export default function DashboardSkeleton() {
    return (
        <div className="p-6 md:p-8 pb-32 max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8 animate-pulse">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex flex-col gap-2">
                    <div className="h-8 w-64 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                    <div className="h-4 w-96 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                </div>
                <div className="flex gap-3">
                    <div className="h-10 w-28 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
                    <div className="h-10 w-32 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-44 bg-gray-100 dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] p-6 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-2">
                                <div className="h-3 w-24 bg-gray-200 dark:bg-[#222] rounded"></div>
                                <div className="h-8 w-32 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                            </div>
                            <div className="h-8 w-8 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between">
                                <div className="h-3 w-20 bg-gray-200 dark:bg-[#222] rounded"></div>
                                <div className="h-3 w-16 bg-gray-200 dark:bg-[#222] rounded"></div>
                            </div>
                            <div className="h-1.5 w-full bg-gray-200 dark:bg-[#222] rounded-full"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111] p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-[#222] h-[400px]">
                    <div className="flex justify-between items-center mb-8">
                        <div className="space-y-2">
                            <div className="h-6 w-40 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                            <div className="h-4 w-60 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                        </div>
                    </div>
                    <div className="flex items-end gap-4 h-[250px] overflow-hidden">
                        {[65, 45, 80, 35, 70, 55, 90, 40].map((height, i) => (
                            <div key={i} className="flex-1 bg-gray-100 dark:bg-[#1A1A1A] rounded-t-lg" style={{ height: `${height}%` }}></div>
                        ))}
                    </div>
                </div>

                {/* Side List */}
                <div className="bg-white dark:bg-[#111] p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-[#222] h-[400px] flex flex-col gap-4">
                    <div className="h-6 w-40 bg-gray-200 dark:bg-[#222] rounded-lg mb-4"></div>
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                                <div className="space-y-1">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                                    <div className="h-3 w-16 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                                </div>
                            </div>
                            <div className="h-6 w-8 bg-gray-200 dark:bg-[#222] rounded"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* System Status Banner */}
            <div className="h-32 bg-gray-900 rounded-2xl"></div>

        </div>
    );
}
