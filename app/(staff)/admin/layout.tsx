import AdminFloatingNav from '@/app/components/AdminFloatingNav';
import type { Metadata } from 'next';

// Metadata untuk Admin Pages
export const metadata: Metadata = {
    title: "Admin Panel | Nol Coffee",
    robots: "noindex, nofollow",
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <section className="relative min-h-screen">
            {children}
            <AdminFloatingNav />
        </section>
    );
}
