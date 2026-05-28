import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "AigenVideo — кинематографичные AI-ролики",
    template: "%s · AigenVideo",
  },
  description:
    "AI-платформа для создания кинематографичных UGC-роликов и продуктовых видео из одного изображения и короткого брифа.",
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ru"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast:
                "bg-surface-elevated border border-border-strong text-foreground",
            },
          }}
        />
      </body>
    </html>
  );
}
