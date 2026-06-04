import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Melochorus — Democratic Music Queue",
  description:
    "Submit a track, let the room vote, and the highest-voted song plays next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background text-foreground antialiased",
        )}
      >
        <Providers>
          {children}
          <Toaster richColors theme="dark" position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
