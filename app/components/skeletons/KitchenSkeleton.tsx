export default function KitchenSkeleton() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] font-sans text-black p-6">
            {/* Header Skeleton */}
            <header className="flex justify-between items-center mb-8 border-b-4 border-black pb-4 animate-pulse">
                <div className="h-10 w-64 bg-gray-300 rounded"></div>
                <div className="space-y-2 text-right">
                    <div className="h-4 w-32 bg-gray-300 rounded ml-auto"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded ml-auto"></div>
                </div>
            </header>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="border-2 border-gray-300 p-0 shadow-[8px_8px_0px_0px_rgba(200,200,200,0.5)] bg-white animate-pulse">
                        {/* Card Header */}
                        <div className="p-4 border-b-2 border-gray-200 bg-gray-100 flex justify-between items-center">
                            <div className="h-6 w-20 bg-gray-300 rounded"></div>
                            <div className="h-6 w-16 bg-gray-300 rounded"></div>
                        </div>
                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                            <div className="h-4 w-1/2 bg-gray-200 rounded"></div>
                            <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                            <div className="space-y-2 mt-4">
                                <div className="h-3 w-full bg-gray-100 rounded"></div>
                                <div className="h-3 w-full bg-gray-100 rounded"></div>
                                <div className="h-3 w-2/3 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                        {/* Card Footer Actions */}
                        <div className="p-4 flex gap-2 mt-2">
                            <div className="h-10 flex-1 bg-gray-200 rounded"></div>
                            <div className="h-10 flex-1 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
