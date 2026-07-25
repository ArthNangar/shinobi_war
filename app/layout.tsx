import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShinobiSeals - Real-time Hand Sign Battle Arena",
  description: "Next-generation real-time multiplayer Shinobi battle arena powered by hand sign recognition and WebRTC.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-[#060913] text-slate-100 antialiased selection:bg-cyan-500 selection:text-black">
        {children}
      </body>
    </html>
  );
}
