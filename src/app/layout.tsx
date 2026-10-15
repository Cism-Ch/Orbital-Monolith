import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
    variable: "--font-sans",
    subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
    variable: "--font-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Orbital Monolith v3.7 — 3D Space Exploration & Telemetry",
    description: "Advanced 3D WebGL space exploration and celestial telemetry dashboard.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    viewportFit: "cover",
    themeColor: "#050506",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className="bg-[#050506]">
            <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans`}>
                <div className="scanline" />
                {children}
            </body>
        </html>
    );
}
