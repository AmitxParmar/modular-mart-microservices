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
    <html suppressHydrationWarning lang="en" className={cn("font-mono", jetbrainsMono.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ClerkProvider>
            <AppProviders>
              <AuthDialogProvider>

                <Header />

                <div className="container mx-auto flex flex-1 w-full mt-6 gap-8 px-4 pb-12">
                  <Sidebar />
                  <main className="flex-1 w-full min-w-0">
                    {children}
                  </main>
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
