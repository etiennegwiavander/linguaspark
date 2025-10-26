import type React from "react"

// Landing page has its own navbar and footer built-in
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
