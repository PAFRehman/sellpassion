import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PassionHouse — Find the people who move ideas",
  description:
    "The public idea network where credible people find each other, earn access and turn conviction into execution.",
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
