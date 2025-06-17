"use client"

import { useState, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Brain, 
  Sparkles, 
  Users, 
  Trophy,
  Chrome, 
  Linkedin,
  Loader2
} from "lucide-react"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { data: session, status } = useSession()
  const router = useRouter()

  console.log("Auth page session:", session, "status:", status)

  useEffect(() => {
    if (session?.user) {
      console.log("User authenticated, redirecting...")
      // Store user data in localStorage for compatibility
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userEmail", session.user.email || "")
      localStorage.setItem("userName", session.user.name || "User")
      
      // Give bonus points on social registration
      const currentPoints = parseInt(localStorage.getItem("userPoints") || "30")
      localStorage.setItem("userPoints", (currentPoints + 50).toString())
      
      const redirectTo = localStorage.getItem("redirectAfterAuth") || "/"
      localStorage.removeItem("redirectAfterAuth")
      router.push(redirectTo)
    }
  }, [session, router])

  const handleSocialLogin = async (provider: 'google') => {
    try {
      setIsLoading(true)
      console.log(`Signing in with ${provider}`)
      
      const result = await signIn(provider, {
        redirect: false,
        callbackUrl: "/"
      })
      
      if (result?.error) {
        console.error("Social login error:", result.error)
        alert("Errore durante il login. Riprova.")
      } else if (result?.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error("Social login error:", error)
      alert("Errore durante il login. Riprova.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      console.log("Email auth attempt:", { isLogin, email })
      
      // For demo purposes, simulate email auth
      localStorage.setItem("isAuthenticated", "true")
      localStorage.setItem("userEmail", email)
      localStorage.setItem("userName", name || email.split("@")[0])
      
      // Give bonus points on registration
      const currentPoints = parseInt(localStorage.getItem("userPoints") || "30")
      const newPoints = isLogin ? currentPoints : currentPoints + 50
      localStorage.setItem("userPoints", newPoints.toString())
      
      const redirectTo = localStorage.getItem("redirectAfterAuth") || "/"
      localStorage.removeItem("redirectAfterAuth")
      router.push(redirectTo)
    } catch (error) {
      console.error("Email auth error:", error)
      alert("Errore durante l'autenticazione. Riprova.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        
        {/* Left side - Marketing content */}
        <div className="hidden lg:block space-y-8">
          <div className="space-y-4">
            <Link href="/" className="block">
              <h1 className="text-4xl font-bold text-white hover:text-gray-200 transition-colors cursor-pointer">
                PassInterview.AI
              </h1>
            </Link>
            <p className="text-xl text-white/80">
              L'assistente AI che ti aiuta durante le interviste reali. Ascolta e genera risposte personalizzate in tempo reale.
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">AI Personalizzata</h3>
              <p className="text-sm text-muted-foreground">
                Training specifico per ogni posizione lavorativa
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold">Feedback Istantaneo</h3>
              <p className="text-sm text-muted-foreground">
                Ricevi risposte in tempo reale
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <h3 className="font-semibold">Simulazioni Reali</h3>
              <p className="text-sm text-muted-foreground">
                Esperienza di intervista autentica
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold">Migliora le Performance</h3>
              <p className="text-sm text-muted-foreground">
                Sistema di punti e progressi
              </p>
            </div>
          </div>
        </div>

        {/* Right side - Auth forms */}
        <Card className="w-full max-w-md mx-auto shadow-2xl bg-white/95 backdrop-blur-sm border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {isLogin ? "Accedi" : "Registrati"}
            </CardTitle>
            <CardDescription className="text-center">
              {isLogin 
                ? "Benvenuto! Accedi al tuo account per continuare" 
                : "Crea il tuo account e ricevi 80 punti gratuiti"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full gap-2"
                onClick={() => handleSocialLogin("google")}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Chrome className="w-4 h-4" />
                )}
                Continua con Google
              </Button>
              
              {/* LinkedIn removed for now - need OAuth app setup */}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  oppure
                </span>
              </div>
            </div>

            <Tabs value={isLogin ? "login" : "signup"} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login" onClick={() => setIsLogin(true)}>
                  Accedi
                </TabsTrigger>
                <TabsTrigger value="signup" onClick={() => setIsLogin(false)}>
                  Registrati
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@esempio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Accesso...
                      </>
                    ) : (
                      "Accedi"
                    )}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Il tuo nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="nome@esempio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Registrazione...
                      </>
                    ) : (
                      "Registrati - Ricevi 80 punti!"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}