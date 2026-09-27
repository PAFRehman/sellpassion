import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionHouse — Where ideas find builders",
  description:
    "Share an idea, find credible builders, reward useful work and fund the next step toward making it real.",
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
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="antialiased">{children}</body>
    </html>
  );
}
