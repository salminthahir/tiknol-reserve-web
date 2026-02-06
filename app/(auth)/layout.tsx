export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Pass-through layout - login page sudah punya styling sendiri
    return <>{children}</>;
}
