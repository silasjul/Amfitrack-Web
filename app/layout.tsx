import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/sidebar-left/sidebar";
import Providers from "./providers";
import PendingChangesBar from "@/components/PendingChangesBar";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Amfitrack Web",
  description: "USB device connection manager",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} h-full dark`}
    >
      <body className="h-full overflow-hidden flex flex-col bg-black/10 font-sans antialiased">
        <Providers>
          <Sidebar>{children}</Sidebar>
          <PendingChangesBar />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
