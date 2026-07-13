import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture Connect | VC Readiness Platform",
  description:
    "Structured startup discovery, VC readiness, and investor-first communication for founders and ecosystem partners.",
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
