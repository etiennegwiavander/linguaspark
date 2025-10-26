import { Chrome } from "lucide-react"

export default function PublicFooter() {
  return (
    <footer className="bg-vintage-brown text-vintage-cream py-8 border-t-4 border-vintage-gold mt-auto">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/mascot.png" 
              alt="Sparky Mascot" 
              className="w-8 h-8 object-contain opacity-90"
            />
            <div className="text-center md:text-left">
              <p className="font-serif text-lg mb-1">LinguaSpark</p>
              <p className="text-sm opacity-75">
                Professional language lesson creation for modern tutors
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-75">
            <Chrome className="h-4 w-4" />
            <span>Chrome Extension</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
