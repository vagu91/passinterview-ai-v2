"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserMenu } from "@/components/user-menu"
import { 
  Coins, 
  Moon, 
  Sun, 
  Menu,
  X
} from "lucide-react"
import { useTheme } from "next-themes"
import Link from "next/link"

export default function Header() {
  const [userPoints, setUserPoints] = useState(0)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { data: session, status } = useSession()

  console.log("Header rendered, session:", session, "status:", status)

  useEffect(() => {
    const updatePoints = () => {
      if (typeof window !== 'undefined') {
        const points = parseInt(localStorage.getItem("userPoints") || "30")
        setUserPoints(points)
      }
    }

    updatePoints()
    
    // Check for updates every second (for real-time updates)
    const interval = setInterval(updatePoints, 1000)
    
    // Listen for storage changes
    if (typeof window !== 'undefined') {
      window.addEventListener("storage", updatePoints)
    }

    return () => {
      clearInterval(interval)
      if (typeof window !== 'undefined') {
        window.removeEventListener("storage", updatePoints)
      }
    }
  }, [])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const isAuthenticated = !!session?.user

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center">
            <img 
              src="https://assets.macaly-user-data.dev/fskaglby74urf134ia02j0jr/a1dlor5dibojl1isei4idmt9/NSdN2tdQjucvpLsOMN5cY/chat-gpt-image-14-giu-2025-20-09-00-removebg-preview.png" 
              alt="PassInterview.AI Logo" 
              className="w-8 h-8 object-contain dark:filter dark:brightness-0 dark:invert"
            />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">PassInterview.AI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
            Home
          </Link>
          {isAuthenticated && (
            <Link href="/profile" className="text-sm font-medium hover:text-primary transition-colors">
              Profile
            </Link>
          )}
          <Link href="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Plans
          </Link>
        </nav>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Points display */}
          {isAuthenticated && (
            <Badge variant="secondary" className="gap-1 hidden sm:flex">
              <Coins className="w-3 h-3" />
              {userPoints} points
            </Badge>
          )}

          {/* Theme toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-8 w-8 p-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <Moon className="absolute h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User menu or login button */}
          <div className="flex items-center space-x-2">
            <UserMenu />
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileMenu}
              className="md:hidden h-8 w-8 p-0"
            >
              {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <Link 
              href="/" 
              className="block text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            {isAuthenticated && (
              <>
                <Link 
                  href="/profile" 
                  className="block text-sm font-medium hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="gap-1">
                    <Coins className="w-3 h-3" />
                    {userPoints} points
                  </Badge>
                </div>
              </>
            )}
            <Link 
              href="/pricing" 
              className="block text-sm font-medium hover:text-primary transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Plans
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}