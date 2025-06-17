"use client"

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { X, Settings, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react'
import { useConfigStatus } from '@/hooks/use-config-status'

interface ConfigNotificationProps {
  showWhenConfigured?: boolean
  className?: string
}

export default function ConfigNotification({ 
  showWhenConfigured = false, 
  className = "" 
}: ConfigNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const { configStatus, refreshConfig } = useConfigStatus()

  // Don't show if dismissed or if fully configured and showWhenConfigured is false
  if (isDismissed || (!showWhenConfigured && configStatus.isFullyConfigured)) {
    return null
  }

  // Don't show while loading
  if (configStatus.isLoading) {
    return null
  }

  // Show error state
  if (configStatus.error) {
    return (
      <Card className={`border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">
                  Configuration Check Failed
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                  {configStatus.error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshConfig}
                  className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-800/50"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Retry Check
                </Button>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-red-500 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-200 dark:hover:bg-red-800/50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show configuration status
  const isPartiallyConfigured = configStatus.openaiConfigured || configStatus.nextauthConfigured
  const borderColor = configStatus.isFullyConfigured 
    ? "border-green-200 dark:border-green-700" 
    : isPartiallyConfigured 
      ? "border-yellow-200 dark:border-yellow-700"
      : "border-red-200 dark:border-red-700"
  
  const bgColor = configStatus.isFullyConfigured 
    ? "bg-green-50 dark:bg-green-900/20" 
    : isPartiallyConfigured 
      ? "bg-yellow-50 dark:bg-yellow-900/20"
      : "bg-red-50 dark:bg-red-900/20"

  const textColor = configStatus.isFullyConfigured 
    ? "text-green-800 dark:text-green-200" 
    : isPartiallyConfigured 
      ? "text-yellow-800 dark:text-yellow-200"
      : "text-red-800 dark:text-red-200"

  const icon = configStatus.isFullyConfigured ? (
    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
  ) : (
    <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
  )

  return (
    <Card className={`${borderColor} ${bgColor} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {icon}
            <div className="flex-1">
              <h3 className={`font-semibold ${textColor} mb-1`}>
                {configStatus.isFullyConfigured 
                  ? "✅ Configuration Complete" 
                  : "⚙️ Configuration Required"
                }
              </h3>
              
              <div className="space-y-2 mb-3">
                <div className="flex flex-wrap gap-2">
                  <Badge 
                    variant={configStatus.openaiConfigured ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {configStatus.openaiConfigured ? "✓" : "✗"} OpenAI API
                  </Badge>
                  <Badge 
                    variant={configStatus.nextauthConfigured ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {configStatus.nextauthConfigured ? "✓" : "✗"} NextAuth
                  </Badge>
                  <Badge 
                    variant={configStatus.stripeConfigured ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {configStatus.stripeConfigured ? "✓" : "○"} Stripe (optional)
                  </Badge>
                </div>

                {configStatus.isFullyConfigured ? (
                  <p className={`text-sm ${textColor}`}>
                    All essential services are properly configured. Your application is ready to use!
                  </p>
                ) : (
                  <div className={`text-sm ${textColor}`}>
                    <p className="mb-2">Some services need configuration:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {configStatus.recommendations.map((rec, index) => (
                        <li key={index} className="text-xs">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {!configStatus.isFullyConfigured && (
                <div className="space-y-2">
                  <p className={`text-xs ${textColor} font-medium`}>
                    📋 Quick Setup Guide:
                  </p>
                  <div className={`text-xs ${textColor} space-y-1`}>
                    {!configStatus.openaiConfigured && (
                      <div>1. Get OpenAI API key from <code className="bg-white/50 dark:bg-black/30 px-1 rounded">platform.openai.com/api-keys</code></div>
                    )}
                    {!configStatus.nextauthConfigured && (
                      <div>2. Generate NextAuth secret: <code className="bg-white/50 dark:bg-black/30 px-1 rounded">openssl rand -base64 32</code></div>
                    )}
                    <div>3. Add keys to <code className="bg-white/50 dark:bg-black/30 px-1 rounded">.env</code> file in project root</div>
                    <div>4. Restart the development server</div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="text-gray-500 hover:text-gray-700 hover:bg-white/50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-black/30"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}