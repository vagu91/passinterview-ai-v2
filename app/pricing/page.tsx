"use client"

import { useState, useEffect, Suspense } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  Check, 
  Coins, 
  Crown, 
  Star, 
  Zap,
  ArrowRight,
  CheckCircle,
  XCircle,
  Loader2,
  Infinity,
  Gift,
  Calendar,
  CreditCard,
  X
} from "lucide-react"
import Header from "@/components/header"

interface PricingPlan {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  originalMonthlyPrice?: number
  originalAnnualPrice?: number
  points: number | "unlimited"
  popular?: boolean
  features: string[]
  icon: React.ReactNode
  color: string
}

// Component che evita useSearchParams durante SSR
function PricingContent() {
  const [userPoints, setUserPoints] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnnual, setIsAnnual] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [canceled, setCanceled] = useState<string | null>(null)
  const { data: session } = useSession()
  const router = useRouter()

  console.log("Pricing page:", { session, currentSubscription, isAnnual, isClient })

  // Handle client-side hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // Only run in browser after hydration
    if (isClient && typeof window !== 'undefined') {
      const points = localStorage.getItem("userPoints") || "30"
      setUserPoints(parseInt(points))
      
      // Check current subscription (mock for now)
      const subscription = localStorage.getItem("currentSubscription") || "free"
      setCurrentSubscription(subscription)

      // Handle URL parameters only on client side
      const urlParams = new URLSearchParams(window.location.search)
      setSuccess(urlParams.get('success'))
      setCanceled(urlParams.get('canceled'))

      if (urlParams.get('success') === 'true') {
        console.log("Payment successful!")
      }
    }
  }, [isClient])

  // Don't render content until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Loading pricing plans...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  const plans: PricingPlan[] = [
    {
      id: "free",
      name: "Free",
      monthlyPrice: 0,
      annualPrice: 0,
      points: 30,
      icon: <Coins className="w-5 h-5" />,
      color: "text-gray-600",
      features: [
        "30 interview points per month",
        "Bonus credit for daily login",
        "Basic AI responses"
      ]
    },
    {
      id: "standard",
      name: "Standard",
      monthlyPrice: 9.99,
      annualPrice: 95.99,
      originalMonthlyPrice: 14.99,
      originalAnnualPrice: 179.99,
      points: 100,
      icon: <Star className="w-5 h-5" />,
      color: "text-blue-600",
      features: [
        "100 interview points per month",
        "Bonus credit for daily login",
        "Profile saving",
        "Advanced AI training"
      ]
    },
    {
      id: "pro",
      name: "Pro",
      monthlyPrice: 24.99,
      annualPrice: 209.99,
      originalMonthlyPrice: 34.99,
      originalAnnualPrice: 419.99,
      points: 300,
      popular: true,
      icon: <Crown className="w-5 h-5" />,
      color: "text-purple-600",
      features: [
        "300 interview points per month",
        "Bonus credit for daily login",
        "Profile saving",
        "Advanced AI training"
      ]
    },
    {
      id: "relax",
      name: "Relax",
      monthlyPrice: 54.99,
      annualPrice: 659.99,
      points: "unlimited",
      icon: <Infinity className="w-5 h-5" />,
      color: "text-gradient-to-r from-purple-600 to-pink-600",
      features: [
        "Unlimited interview points",
        "Profile saving",
        "Advanced AI training"
      ]
    }
  ]

  const calculateSavings = (plan: PricingPlan) => {
    if (plan.originalMonthlyPrice && plan.originalAnnualPrice) {
      const monthlySavings = plan.originalMonthlyPrice - plan.monthlyPrice
      const annualSavings = plan.originalAnnualPrice - plan.annualPrice
      return { monthlySavings, annualSavings }
    }
    return null
  }

  const handleSubscribe = async (plan: PricingPlan) => {
    try {
      setIsLoading(true)
      console.log("Starting subscription for:", { 
        planId: plan.id, 
        planName: plan.name, 
        isAnnual 
      })
      
      if (!session?.user) {
        if (typeof window !== 'undefined') {
          localStorage.setItem("redirectAfterAuth", "/pricing")
        }
        router.push("/auth")
        return
      }

      // For demo purposes, simulate subscription
      if (typeof window !== 'undefined') {
        localStorage.setItem("currentSubscription", plan.id)
        setCurrentSubscription(plan.id)
      }
      
      // Mock Stripe integration
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: isAnnual ? plan.annualPrice : plan.monthlyPrice,
          interval: isAnnual ? 'yearly' : 'monthly'
        }),
      })

      if (response.ok) {
        alert(`Subscription to ${plan.name} ${isAnnual ? 'Annual' : 'Monthly'} plan activated!`)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Error processing subscription. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancelSubscription = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("currentSubscription", "free")
      setCurrentSubscription("free")
      alert("Subscription cancelled. You'll continue to have access until the end of your billing period.")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          
          {/* Success/Error Messages */}
          {success === 'true' && (
            <Alert className="mb-8 border-green-200 bg-green-50 text-green-800">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment completed!</strong> Your subscription has been activated.
              </AlertDescription>
            </Alert>
          )}
          
          {canceled === 'true' && (
            <Alert className="mb-8 border-yellow-200 bg-yellow-50 text-yellow-800">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Payment cancelled. You can try again anytime.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Subscription */}
          {session?.user && currentSubscription && currentSubscription !== "free" && (
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{currentSubscription} Plan</p>
                  <p className="text-sm text-muted-foreground">
                    {plans.find(p => p.id === currentSubscription)?.points === "unlimited" 
                      ? "Unlimited points" 
                      : `${plans.find(p => p.id === currentSubscription)?.points} points per month`
                    }
                  </p>
                </div>
                <Button variant="outline" onClick={handleCancelSubscription}>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Header */}
          <div className="text-center space-y-6 mb-16">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold">Choose Your Plan</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Select the perfect plan for your interview preparation needs. 
                All plans include personalized AI responses during your real interviews.
              </p>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Badge variant="secondary" className="gap-1">
                <Coins className="w-4 h-4" />
                Current points: {userPoints}
              </Badge>
              <Badge variant="outline">
                1 response = 1 point
              </Badge>
            </div>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
              <span className={`text-sm font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Monthly
              </span>
              <Switch
                checked={isAnnual}
                onCheckedChange={setIsAnnual}
              />
              <span className={`text-sm font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
                Annual
              </span>
              <Badge variant="secondary" className="ml-2">
                <Gift className="w-3 h-3 mr-1" />
                Save up to 50%
              </Badge>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-8 mb-16">
            {plans.map((plan) => {
              const savings = calculateSavings(plan)
              const currentPrice = isAnnual ? plan.annualPrice : plan.monthlyPrice
              const originalPrice = isAnnual ? plan.originalAnnualPrice : plan.originalMonthlyPrice
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative transition-all hover:shadow-lg flex flex-col h-full glow-border ${
                    plan.popular ? 'border-2 border-primary shadow-lg scale-105' : ''
                  } ${currentSubscription === plan.id ? 'border-2 border-green-500' : ''}`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Zap className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  )}

                  {currentSubscription === plan.id && (
                    <Badge className="absolute -top-3 right-4 bg-green-500">
                      <Check className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  
                  <CardHeader className="text-center space-y-4">
                    <div className={`w-12 h-12 mx-auto rounded-xl flex items-center justify-center ${
                      plan.popular ? 'bg-primary text-primary-foreground' : 
                      currentSubscription === plan.id ? 'bg-green-500 text-white' : 'bg-muted'
                    }`}>
                      {plan.icon}
                    </div>
                    
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <div className="mt-2 space-y-1">
                        {originalPrice && originalPrice > currentPrice ? (
                          <div className="flex items-center justify-center gap-2">
                            <span className="text-lg line-through text-muted-foreground">
                              ${originalPrice}
                            </span>
                            <Badge variant="destructive" className="text-xs">
                              {savings && isAnnual ? 
                                `-${Math.round(savings.annualSavings / 12)}/mo` : 
                                `-${Math.round(savings?.monthlySavings || 0)}/mo`
                              }
                            </Badge>
                          </div>
                        ) : null}
                        <div>
                          <span className="text-3xl font-bold">${currentPrice}</span>
                          <span className="text-muted-foreground">
                            {plan.id === "free" ? "" : isAnnual ? "/year" : "/month"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <Badge variant="outline" className="mx-auto">
                      {plan.points === "unlimited" ? (
                        <div className="flex items-center gap-1">
                          <Infinity className="w-4 h-4" />
                          Unlimited points
                        </div>
                      ) : (
                        `${plan.points} points/month`
                      )}
                    </Badge>
                  </CardHeader>
                  
                  <CardContent className="space-y-6 flex flex-col h-full">
                    <ul className="space-y-3 flex-grow">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <div className="mt-auto">
                      {currentSubscription === plan.id ? (
                        <Button className="w-full" disabled>
                          <Check className="w-4 h-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : (
                        <Button 
                          className="w-full gap-2"
                          variant={plan.popular ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan)}
                          disabled={isLoading || plan.id === "free"}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : plan.id === "free" ? (
                            "Current Plan"
                          ) : (
                            <>
                              {currentSubscription === "free" ? "Get Started" : "Upgrade"}
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* FAQ Section */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    How does the points system work?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Points reset monthly on your billing date. Each AI response during your interview costs 1 point. 
                    All plan users get 5 bonus points for their first daily login, but these also reset monthly.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    What are daily login bonuses?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All plan subscribers earn 5 bonus points for their first login each day. 
                    These bonus points reset monthly along with your regular plan points.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Can I cancel anytime?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Yes! You can cancel your subscription at any time. You'll continue to have access 
                    to your plan features until the end of your current billing period.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Infinity className="w-5 h-5" />
                    What does unlimited mean?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    The Relax plan offers unlimited interview points - no counting, no limits. 
                    Perfect for heavy users or teams who need extensive interview practice.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    How much can I save annually?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Annual plans offer significant savings: Standard saves $84/year, Pro saves $210/year. 
                    That's like getting 2-5 months free!
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Do unused points carry over?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    All points including daily login bonus points reset each billing cycle. 
                    Use your points within your billing period to get the most value.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-accent/10">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-6 mb-16">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold">Choose Your Plan</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Loading pricing plans...
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    }>
      <PricingContent />
    </Suspense>
  )
}