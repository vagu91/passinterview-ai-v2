import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/components/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PassInterview.AI",
  description: "AI Assistant that helps you during real interviews - Listens to questions and generates personalized responses in real-time",
  icons: {
    icon: "https://assets.macaly-user-data.dev/fskaglby74urf134ia02j0jr/a1dlor5dibojl1isei4idmt9/NSdN2tdQjucvpLsOMN5cY/chat-gpt-image-14-giu-2025-20-09-00-removebg-preview.png",
    shortcut: "https://assets.macaly-user-data.dev/fskaglby74urf134ia02j0jr/a1dlor5dibojl1isei4idmt9/NSdN2tdQjucvpLsOMN5cY/chat-gpt-image-14-giu-2025-20-09-00-removebg-preview.png",
    apple: "https://assets.macaly-user-data.dev/fskaglby74urf134ia02j0jr/a1dlor5dibojl1isei4idmt9/NSdN2tdQjucvpLsOMN5cY/chat-gpt-image-14-giu-2025-20-09-00-removebg-preview.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              {children}
            </AuthProvider>
            <Toaster />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}