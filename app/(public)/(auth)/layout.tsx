import type React from "react"
import PublicNavbar from "@/components/public-navbar"
import PublicFooter from "@/components/public-footer"

// Auth pages (signin/signup) get navbar and footer
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <PublicNavbar />
      <main className="flex-1">
        {children}
      </main>
      <PublicFooter />
    </div>
  )
}
