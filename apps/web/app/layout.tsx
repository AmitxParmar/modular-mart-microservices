import type { Metadata } from "next";
import { Geist, Geist_Mono, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ThemeProvider from "@/providers/theme-provider";
import { cn } from "@/lib/utils";
import { AuthDialogProvider } from "@/features/auth/auth-dialog-context";
import { AppProviders } from "@/providers/app-providers";
import dynamic from "next/dynamic";

const AuthDialog = dynamic(() =>
  import("@/features/auth/auth-dialog").then((mod) => mod.AuthDialog),
);
const Toaster = dynamic(() =>
  import("@/components/ui/sonner").then((mod) => mod.Toaster),
);

const geistSans = Geist({
  variable: "--font-geist-sans",
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
    <html
      suppressHydrationWarning
      lang="en"
      className={cn("font-sans", geistSans.variable)}
    >
      <head>
        {/* // Establish an early connection to Clerk to reduce authentication latency. */}
        <link
          rel="dns-prefetch"
          href="https://fun-hippo-3.clerk.accounts.dev"
        />

        <link
          rel="preconnect"
          href="https://fun-hippo-3.clerk.accounts.dev"
          crossOrigin="anonymous"
        />
      </head>
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
