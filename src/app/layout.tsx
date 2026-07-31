import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Venture Connect | Startup preparation workspace",
  description:
    "Structure startup ideas, validate assumptions, prepare applications, and discover relevant programmes.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    title: "Venture Connect",
    description: "From an early idea to an opportunity-ready startup.",
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
