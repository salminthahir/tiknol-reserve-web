export default function HistorySkeleton() {
    return (
        <div className="min-h-screen bg-[#F5F5F5] font-sans text-black p-6">
            {/* Header Skeleton */}
            <header className="flex justify-between items-center mb-8 border-b-4 border-black pb-4 animate-pulse">
                <div className="h-10 w-48 bg-gray-300 rounded"></div>
                <div className="h-10 w-32 bg-gray-300 rounded"></div>
            </header>

            {/* List Skeleton */}
            <div className="space-y-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="border-2 border-gray-300 p-4 bg-white shadow-[4px_4px_0px_0px_rgba(200,200,200,0.5)] animate-pulse">
                        <div className="flex justify-between items-center mb-3 border-b border-gray-200 pb-2">
                            <div className="h-6 w-24 bg-gray-300 rounded"></div>
                            <div className="h-5 w-16 bg-gray-300 rounded"></div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            <div className="h-5 w-48 bg-gray-300 rounded"></div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            <div className="h-3 w-full bg-gray-100 rounded"></div>
                            <div className="h-3 w-full bg-gray-100 rounded"></div>
                        </div>

                        <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                            <div className="h-6 w-20 bg-gray-300 rounded"></div>
                            <div className="h-6 w-32 bg-gray-300 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
