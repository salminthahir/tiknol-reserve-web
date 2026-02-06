import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Nol Coffee - Menu & Order",
    description: "Pesan kopi favoritmu secara online di Nol Coffee",
    openGraph: {
        title: "Nol Coffee",
        description: "The last drop point - Pesan kopi online",
        type: "website",
    },
};

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
