import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import ThemeProvider from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import Header from "@/common/header";
import { AuthDialogProvider } from "@/features/auth/auth-dialog-context";
import { AuthDialog } from "@/features/auth/auth-dialog";
import Sidebar from "@/common/sidebar";

const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modular Mart",
  description: "Microservices based E-commerce Application",
};

import { AppProviders } from "@/providers/app-providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html suppressHydrationWarning lang="en" className={cn("font-sans", geistSans.variable, geistMono.variable, jetbrainsMono.variable)}>
      <body className="antialiased min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <AppProviders>
              <AuthDialogProvider>

                <div className="flex flex-col min-h-screen w-full">
                  <Header />
                  <div className="flex flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-12 gap-12 pb-24">
                    <Sidebar />
                    <main className="flex-1 w-full min-w-0">
                      {children}
                    </main>
                  </div>
                </div>

                <AuthDialog />

              </AuthDialogProvider>
            </AppProviders>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
