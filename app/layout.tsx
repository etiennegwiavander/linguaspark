import type React from "react"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import AuthWrapper from "@/components/auth-wrapper"

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
})

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
