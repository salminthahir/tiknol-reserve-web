import React from 'react';

export default function FormSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-6 lg:p-10 animate-pulse flex flex-col gap-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="space-y-2 mb-4">
                <div className="h-10 w-64 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                <div className="h-4 w-96 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-[#111] p-8 rounded-2xl border border-gray-100 dark:border-[#222]">
                <div className="space-y-8">
                    {/* Field 1 */}
                    <div className="space-y-4">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                        <div className="h-12 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#333]"></div>
                        <div className="h-4 w-64 bg-gray-50 dark:bg-[#151515] rounded"></div>
                    </div>

                    {/* Field 2 */}
                    <div className="space-y-4">
                        <div className="h-5 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                        <div className="flex gap-4">
                            <div className="flex-1 h-12 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#333]"></div>
                            <div className="flex-1 h-12 bg-gray-100 dark:bg-[#1A1A1A] rounded-xl border border-gray-200 dark:border-[#333]"></div>
                        </div>
                    </div>

                    {/* Button */}
                    <div className="pt-4">
                        <div className="h-12 w-32 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
