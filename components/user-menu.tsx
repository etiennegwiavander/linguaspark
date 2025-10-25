"use client"

import { useState } from "react"
import { useAuth } from "@/components/auth-wrapper"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { User, LogOut, Loader2 } from "lucide-react"

export default function UserMenu() {
  const { user, signOut } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    console.log('[UserMenu] Sign out clicked')
    setIsSigningOut(true)
    
    // Set a timeout to force reload if sign-out takes too long
    const timeoutId = setTimeout(() => {
      console.log('[UserMenu] Sign out timeout, forcing reload...')
      window.location.reload()
    }, 3000) // 3 seconds timeout
    
    try {
      console.log('[UserMenu] Calling signOut()...')
      await signOut()
      console.log('[UserMenu] Sign out successful')
      
      clearTimeout(timeoutId)
      
      // Force reload to clear state and show sign-in form
      console.log('[UserMenu] Reloading page...')
      window.location.reload()
    } catch (error) {
      clearTimeout(timeoutId)
      console.error('[UserMenu] Sign out error:', error)
      
      // Even if there's an error, try to reload (might still work)
      console.log('[UserMenu] Error occurred, reloading anyway...')
      window.location.reload()
    }
  }

  // Get user initials for avatar
  const getInitials = () => {
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return user.email?.charAt(0).toUpperCase() || "U"
  }

  return (
    <div className="flex items-center gap-2">
      {/* Simple sign-out button (always works) */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleSignOut}
        disabled={isSigningOut}
        className="flex items-center gap-2"
      >
        {isSigningOut ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Signing out...</span>
          </>
        ) : (
          <>
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </>
        )}
      </Button>

      {/* Dropdown menu (fancy version) */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative h-10 w-10 rounded-full"
            onClick={() => console.log('[UserMenu] Avatar clicked')}
          >
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user.user_metadata?.full_name || "User"}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="cursor-default">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
            {isSigningOut ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </>
            )}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
