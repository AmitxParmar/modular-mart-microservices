import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import ThemeProvider from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { AuthDialogProvider } from "@/features/auth/auth-dialog-context";
import { AuthDialog } from "@/features/auth/auth-dialog";
import { AppProviders } from "@/providers/app-providers";
import { Toaster } from "@/components/ui/sonner";

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

                {children}

                <AuthDialog />
                <Toaster />

              </AuthDialogProvider>
            </AppProviders>
          </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
