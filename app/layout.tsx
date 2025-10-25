import type React from "react"
import { Inter, JetBrains_Mono, Merriweather, Lora } from "next/font/google"
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

const merriweather = Merriweather({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
})

const lora = Lora({
  variable: "--font-serif-alt",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} ${merriweather.variable} ${lora.variable} antialiased`}>
      <body className="min-h-screen bg-vintage-cream font-sans antialiased">
        <AuthWrapper>{children}</AuthWrapper>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.app'
    };
