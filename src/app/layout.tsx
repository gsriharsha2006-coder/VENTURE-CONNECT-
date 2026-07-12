import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture Connect | AI VC Readiness Platform",
  description:
    "AI-powered venture capital readiness platform for founders, students, accelerators, incubators, investors, and admins.",
  metadataBase: new URL("https://venture-connect.local"),
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    title: "Venture Connect",
    description: "Discover, build, connect, and fund startup opportunities with VC-grade readiness reports.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
