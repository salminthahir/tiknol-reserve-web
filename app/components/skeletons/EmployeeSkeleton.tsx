'use client';

export default function EmployeeSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-gray-200">
                    {/* Card Header */}
                    <div className="bg-gray-50 border-b-2 border-gray-100 p-4 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded"></div>
                            <div className="h-6 w-20 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-6 w-16 bg-gray-100 rounded"></div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
                            <div className="flex-1">
                                <div className="h-5 w-32 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 w-24 bg-gray-100 rounded"></div>
                            </div>
                        </div>

                        {/* Device Status Skeleton */}
                        <div className="h-10 w-full bg-gray-50 rounded-lg mb-4 border-2 border-gray-100"></div>

                        {/* Action Buttons Skeleton */}
                        <div className="grid grid-cols-2 gap-2">
                            {[1, 2, 3, 4].map((j) => (
                                <div key={j} className="h-8 bg-gray-100 rounded-lg"></div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
