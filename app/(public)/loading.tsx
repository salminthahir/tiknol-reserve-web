export default function PublicLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-400 border-t-transparent" />
                <p className="text-gray-500 text-sm">Memuat...</p>
            </div>
        </div>
    );
}
