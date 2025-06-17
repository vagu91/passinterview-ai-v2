"use client"

import React, { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import Link from 'next/link'

console.log('Configuration checker component initialized');

interface ConfigStatus {
  hasOpenAIKey: boolean
  isChecking: boolean
  error?: string
}

export default function ConfigChecker() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    hasOpenAIKey: false,
    isChecking: true
  })

  useEffect(() => {
    checkConfiguration()
  }, [])

  const checkConfiguration = async () => {
    setConfigStatus(prev => ({ ...prev, isChecking: true }))
    
    try {
      // Test if OpenAI is configured by making a simple request
      const response = await fetch('/api/config-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ test: true })
      })
      
      const data = await response.json()
      
      setConfigStatus({
        hasOpenAIKey: data.hasOpenAI || false,
        isChecking: false,
        error: data.error
      })
      
    } catch (error) {
      console.log('Config check failed, assuming not configured:', error)
      setConfigStatus({
        hasOpenAIKey: false,
        isChecking: false,
        error: 'Unable to verify configuration'
      })
    }
  }

  if (configStatus.isChecking) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          Checking AI configuration...
        </AlertDescription>
      </Alert>
    )
  }

  if (configStatus.hasOpenAIKey) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <strong>AI Features Active:</strong> OpenAI is configured and ready for enhanced document analysis and intelligent responses.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800 dark:text-orange-200">
        <div className="flex items-center justify-between">
          <div>
            <strong>Limited Features:</strong> OpenAI API not configured. Enhanced AI features are disabled.
          </div>
          <div className="flex gap-2 ml-4">
            <Link href="/setup">
              <Button 
                size="sm" 
                variant="outline" 
                className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900/30"
              >
                Setup Guide
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
}