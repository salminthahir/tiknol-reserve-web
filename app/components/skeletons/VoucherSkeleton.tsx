export default function VoucherSkeleton() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] p-6 lg:p-10 font-sans">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6 animate-pulse">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                    <div className="h-5 w-48 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                </div>
                <div className="h-12 w-40 bg-gray-200 dark:bg-[#222] rounded-xl"></div>
            </div>

            {/* Filter Skeleton */}
            <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] shadow-sm mb-8 flex gap-4 animate-pulse">
                <div className="flex-1 h-10 bg-gray-100 dark:bg-[#1A1A1A] rounded-lg"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="group relative bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden shadow-sm h-64 animate-pulse">

                        {/* Cutouts */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-full border-r border-gray-200 dark:border-[#222] z-10"></div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-full border-l border-gray-200 dark:border-[#222] z-10"></div>

                        {/* Content */}
                        <div className="flex h-full flex-col">
                            {/* Top Part */}
                            <div className="flex-1 p-6 relative border-b border-dashed border-gray-200 dark:border-[#333]">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="h-8 w-24 bg-gray-200 dark:bg-[#222] rounded-md"></div>
                                    <div className="h-6 w-16 bg-gray-100 dark:bg-[#1A1A1A] rounded-full"></div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-6 w-3/4 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                                    <div className="h-4 w-1/2 bg-gray-100 dark:bg-[#1A1A1A] rounded"></div>
                                </div>
                            </div>

                            {/* Bottom Part */}
                            <div className="p-4 bg-gray-50 dark:bg-[#1A1A1A] flex gap-2">
                                <div className="flex-1 h-10 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                                <div className="flex-1 h-10 bg-gray-200 dark:bg-[#222] rounded-lg"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
