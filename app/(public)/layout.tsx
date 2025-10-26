import type React from "react"

// Public pages don't need AuthWrapper
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
