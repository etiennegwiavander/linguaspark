"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function PublicNavbar() {
  return (
    <nav className="sticky top-0 z-50 bg-vintage-cream border-b-3 border-vintage-brown shadow-vintage">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-vintage-gold/20 rounded-full blur-sm"></div>
              <img 
                src="/mascot.png" 
                alt="Sparky Mascot" 
                className="relative w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-vintage-brown">
                LinguaSpark
              </h1>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button
                variant="ghost"
                className="text-vintage-brown hover:text-vintage-burgundy font-serif"
              >
                Home
              </Button>
            </Link>
            <Link href="/library">
              <Button
                variant="ghost"
                className="text-vintage-brown hover:text-vintage-burgundy font-serif"
              >
                Lesson Materials
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
