import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "../components/ThemeProvider";
import { UILanguageProvider } from "../contexts/UILanguageContext";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "LingoLearn — Learn Any Video in Any Language",
  description:
    "Transform any YouTube video into an interactive, quiz-driven learning experience in 130+ languages powered by Lingo.dev",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <UILanguageProvider>
            <Navigation />
            <main className="pt-24 min-h-screen">
              {children}
            </main>
            <Footer />
          </UILanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
