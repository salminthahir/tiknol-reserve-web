export default function PosSkeleton() {
    return (
        <div className="flex h-[100dvh] bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] font-sans overflow-hidden flex-col lg:flex-row relative p-2 lg:p-3 gap-3">

            {/* LEFT: MENU SECTION */}
            <div className="flex-1 flex flex-col w-full h-full">

                {/* Header Skeleton - Floating Compact */}
                <div className="sticky top-0 z-20 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] flex flex-col gap-2.5 shrink-0 border border-gray-100 p-3.5 mb-3 animate-pulse">
                    <div className="flex justify-between items-center px-1">
                        {/* Brand Skeleton */}
                        <div className="h-6 w-48 bg-gray-200 rounded"></div>
                        {/* Buttons Skeleton */}
                        <div className="flex gap-2">
                            <div className="h-7 w-16 bg-gray-200 rounded-full"></div>
                            <div className="h-7 w-20 bg-gray-200 rounded-full"></div>
                        </div>
                    </div>

                    {/* Search & Filters */}
                    <div className="flex flex-col gap-2">
                        {/* Search Bar */}
                        <div className="h-10 w-full bg-gray-100 rounded-xl border border-gray-200"></div>

                        {/* Sort Controls */}
                        <div className="flex gap-1.5">
                            <div className="h-8 w-16 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                            <div className="h-8 w-20 bg-gray-200 rounded-lg"></div>
                        </div>

                        {/* Categories */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="h-8 w-20 bg-gray-200 rounded-full flex-shrink-0"></div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Products Grid Skeleton */}
                <div className="flex-1 px-1 overflow-y-auto pb-24 lg:pb-6 scrollbar-hide">
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 lg:gap-3">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                            <div
                                key={i}
                                className="bg-white border border-gray-100 rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col animate-pulse"
                            >
                                {/* Image Skeleton */}
                                <div className="h-24 lg:h-32 w-full bg-gradient-to-br from-gray-100 to-gray-200"></div>
                                {/* Content Skeleton */}
                                <div className="p-2 flex flex-col items-center text-center gap-1">
                                    <div className="h-3 w-3/4 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* RIGHT: CART SECTION (Desktop) */}
            <div className="hidden lg:flex bg-white rounded-3xl overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.1)] w-[420px] flex-col">

                {/* Cart Header - Yellow */}
                <div className="p-6 bg-[#FFC567] border-b border-black/10 flex justify-between items-start shrink-0 animate-pulse">
                    <div className="flex-1 space-y-2">
                        <div className="h-7 w-32 bg-black/10 rounded"></div>
                        <div className="flex gap-2">
                            <div className="h-5 w-16 bg-black/10 rounded"></div>
                            <div className="h-5 w-20 bg-black/10 rounded-lg"></div>
                            <div className="h-5 w-24 bg-black/10 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="h-8 w-8 bg-black/10 rounded-full"></div>
                </div>

                {/* Cart Items */}
                <div className="flex-1 p-6 space-y-3 overflow-y-auto">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl animate-pulse">
                            <div className="h-16 w-16 bg-gray-200 rounded-lg flex-shrink-0"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                                <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                                <div className="flex gap-2 mt-2">
                                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-8 bg-gray-200 rounded"></div>
                                    <div className="h-6 w-6 bg-gray-200 rounded"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Payment Footer - Dark */}
                <div className="p-6 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-t border-white/10 space-y-4 shrink-0 animate-pulse">
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <div className="h-3 w-16 bg-white/20 rounded"></div>
                            <div className="h-3 w-20 bg-white/30 rounded"></div>
                        </div>
                        <div className="flex justify-between">
                            <div className="h-3 w-12 bg-white/20 rounded"></div>
                            <div className="h-3 w-16 bg-white/30 rounded"></div>
                        </div>
                        <div className="my-3 border-b-2 border-white/20 border-dashed"></div>
                        <div className="flex justify-between items-center">
                            <div className="h-5 w-16 bg-white/30 rounded"></div>
                            <div className="h-8 w-32 bg-[#FFC567]/30 rounded-lg"></div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                        <div className="h-12 bg-white/20 rounded-xl"></div>
                        <div className="h-12 bg-white/10 rounded-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
