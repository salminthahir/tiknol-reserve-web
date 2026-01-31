export default function VoucherSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] p-3 lg:p-6 font-sans">
            {/* Header Skeleton */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-5 mb-6 animate-pulse">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div className="space-y-2">
                        <div className="h-8 w-48 bg-gray-200 rounded-lg"></div>
                        <div className="h-4 w-64 bg-gray-100 rounded"></div>
                    </div>
                    <div className="h-10 w-32 bg-gray-200 rounded-xl"></div>
                </div>
            </div>

            {/* Filter & Search Skeleton */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-4 mb-6 flex gap-4 animate-pulse">
                <div className="flex-1 h-10 bg-gray-100 rounded-xl"></div>
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
            </div>

            {/* Vouchers Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm animate-pulse relative">
                        {/* Decorative side strip */}
                        <div className="absolute top-0 left-0 w-2 h-full bg-gray-200"></div>

                        <div className="p-5 pl-7">
                            {/* Top Row: Code & Status */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="h-8 w-24 bg-gray-200 rounded-lg"></div>
                                <div className="h-6 w-16 bg-gray-100 rounded-full"></div>
                            </div>

                            {/* Middle: Info */}
                            <div className="space-y-3 mb-6">
                                <div className="h-6 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-4 w-full bg-gray-100 rounded"></div>
                                <div className="h-4 w-1/2 bg-gray-100 rounded"></div>
                            </div>

                            {/* Bottom: Metrics */}
                            <div className="flex gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100 mb-4">
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                                    <div className="h-5 w-8 bg-gray-300 rounded"></div>
                                </div>
                                <div className="w-px bg-gray-200"></div>
                                <div className="flex-1 space-y-1">
                                    <div className="h-3 w-12 bg-gray-200 rounded"></div>
                                    <div className="h-5 w-8 bg-gray-300 rounded"></div>
                                </div>
                            </div>

                            {/* Footer: Actions */}
                            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                                <div className="h-9 bg-gray-100 rounded-lg"></div>
                                <div className="h-9 bg-gray-100 rounded-lg"></div>
                            </div>
                        </div>

                        {/* Cutout circles for ticket look (optional visual flair in skeleton too) */}
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FFF8E7] rounded-full border-2 border-gray-200 z-10"></div>
                        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FFF8E7] rounded-full border-2 border-gray-200 z-10"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
