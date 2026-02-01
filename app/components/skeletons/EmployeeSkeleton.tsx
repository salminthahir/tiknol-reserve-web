'use client';

export default function EmployeeSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-[#111] rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-[#222]">

                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-[#222]"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-32 bg-gray-200 dark:bg-[#222] rounded"></div>
                                <div className="h-3 w-20 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            </div>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="h-4 w-full bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                            <div className="h-4 w-1/2 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-[#222]">
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                            <div className="flex-1 h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                            <div className="w-8 h-8 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
