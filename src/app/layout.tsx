import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Celestial Orbital Monolith v2",
    description: "Advanced Gaia Database Mapping Terminal",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className="antialiased font-sans">
                <div className="grain" />
                <div className="scanline" />
                {children}
            </body>
        </html>
    );
}
