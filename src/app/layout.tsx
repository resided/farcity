import type { Metadata, Viewport } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Claudity - Build Your Empire",
  description: "An isometric city-building simulation game. Build, earn, and grow your dream metropolis!",
  keywords: ["game", "city builder", "simulation", "building", "strategy"],
  authors: [{ name: "Claudity" }],
  openGraph: {
    title: "Claudity - Build Your Empire",
    description: "Build the ultimate city in Claudity!",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claudity - Build Your Empire",
    description: "Build the ultimate city in Claudity!",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0a0a12",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${spaceGrotesk.variable} font-sans antialiased bg-[#0a0a12] text-white selection:bg-violet-500/30`}
      >
        {children}
      </body>
    </html>
  );
}
