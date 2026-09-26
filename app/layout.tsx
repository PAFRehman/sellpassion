import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionHouse — Ideas into motion",
  description:
    "Discover validated ideas, find credible builders, control disclosure and execute together.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">{children}</body>
    </html>
  );
}
