import AdminFloatingNav from '@/app/components/AdminFloatingNav';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="relative min-h-screen">
            {/* Content */}
            <div>
                {children}
            </div>

            {/* Floating Navigation */}
            <AdminFloatingNav />
        </section>
    );
}
