import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider";
import Navbar from "@/components/navbar";
import { RainbowKitWrapper } from "@/rainbow-wallet/rainbow-provider";
import { AuthProvider } from "@/auth/auth-context";
import AuthWrapper from "@/auth/auth-wrapper";

const departureMono = localFont({
  src: "./fonts/DepartureMono-Regular.woff",
  variable: "--font-departure-mono",
  display: "swap",
});

export const metadata = {
  title: "Hangman Game | Inco",
  description: "A simple hangman game",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${departureMono.variable} antialiased min-h-screen bg-[url('/bg-lines.svg')] bg-cover bg-center bg-[#020B20]`}
        style={{ fontFamily: "var(--font-departure-mono)" }}
      >
        {" "}
        <RainbowKitWrapper>
          <AuthProvider>
            <AuthWrapper>
              <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
              >
                {children}
              </ThemeProvider>
            </AuthWrapper>
          </AuthProvider>
        </RainbowKitWrapper>
      </body>
    </html>
  );
}
