import type React from "react"
import AuthWrapper from "@/components/auth-wrapper"

// Protected routes require authentication
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthWrapper>{children}</AuthWrapper>
}
