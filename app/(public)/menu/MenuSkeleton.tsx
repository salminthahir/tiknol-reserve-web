import { Skeleton } from "@/components/ui/skeleton"

export function MenuSkeleton() {
    return (
        <div className="min-h-screen bg-white dark:bg-[#080808] transition-colors duration-500">
            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-40 h-20 px-4 md:px-8 flex items-center justify-between bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Skeleton className="w-16 h-8 bg-white/10" />
                    <Skeleton className="w-24 h-6 bg-white/10 hidden md:block" />
                </div>
                <Skeleton className="w-48 h-10 rounded-full bg-white/10" />
                <div className="flex items-center gap-2">
                    <Skeleton className="w-24 h-10 rounded-full bg-white/10 hidden md:block" />
                    <Skeleton className="w-9 h-9 rounded-xl bg-white/10" />
                </div>
            </nav>

            {/* HERO */}
            <section className="pt-32 pb-16 px-4 text-center border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#080808] to-[#080808]">
                <div className="flex flex-col items-center gap-4">
                    <Skeleton className="w-32 h-6 rounded-full bg-white/10" />
                    <Skeleton className="w-3/4 md:w-1/2 h-16 md:h-24 bg-white/10 rounded-lg" />
                </div>
            </section>

            {/* MARQUEE */}
            <div className="h-8 bg-[#FBC02D] w-full" />

            <div className="flex flex-col lg:flex-row relative">
                <div className="flex-1 min-h-screen">
                    {/* FILTER BAR - Top Sticky */}
                    <div className="sticky top-20 z-30 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 py-4 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <Skeleton className="w-full md:w-64 h-10 rounded-lg bg-white/5" />
                        <div className="flex gap-2 overflow-hidden">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Skeleton key={i} className="w-20 h-8 rounded-full bg-white/5 flex-shrink-0" />
                            ))}
                        </div>
                    </div>

                    {/* GRID */}
                    <div className="p-4 md:p-8 pb-32 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-[#111] border border-neutral-200 dark:border-white/5 space-y-2">
                                <Skeleton className="w-full h-full bg-neutral-200 dark:bg-white/5" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
