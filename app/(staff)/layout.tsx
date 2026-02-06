import AdminFloatingNav from '@/app/components/AdminFloatingNav';
import type { Metadata } from 'next';

// Metadata minimal - hanya untuk tab browser, BUKAN SEO
export const metadata: Metadata = {
    title: "Staff Panel | Nol Coffee",
    robots: "noindex, nofollow", // Pastikan tidak diindeks Google
};

export default function StaffLayout({
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
