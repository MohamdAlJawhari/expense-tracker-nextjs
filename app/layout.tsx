import type { Metadata } from "next";
import { Roboto, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import Header from "@/components/Header";

const roboto = Roboto({
  weight: '400',
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Expense Tracker",
  description: "Track Your Expenses and Create a Budget",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${roboto.variable} ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className={roboto.className}>
          <Header />
          <main className="container">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  )
}
