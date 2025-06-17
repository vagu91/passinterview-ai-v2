"use client"

import { useState, useEffect } from 'react'

interface ConfigStatus {
  openaiConfigured: boolean
  nextauthConfigured: boolean
  stripeConfigured: boolean
  environment: string
  isFullyConfigured: boolean
  recommendations: string[]
  isLoading: boolean
  error: string | null
}

export function useConfigStatus() {
  const [configStatus, setConfigStatus] = useState<ConfigStatus>({
    openaiConfigured: false,
    nextauthConfigured: false,
    stripeConfigured: false,
    environment: 'development',
    isFullyConfigured: false,
    recommendations: [],
    isLoading: true,
    error: null
  })

  const checkConfig = async () => {
    try {
      setConfigStatus(prev => ({ ...prev, isLoading: true, error: null }))
      
      const response = await fetch('/api/config-check')
      const data = await response.json()
      
      if (data.success) {
        setConfigStatus({
          openaiConfigured: data.details.openaiConfigured,
          nextauthConfigured: data.details.nextauthConfigured,
          stripeConfigured: data.details.stripeConfigured,
          environment: data.details.environment,
          isFullyConfigured: data.configured,
          recommendations: data.recommendations || [],
          isLoading: false,
          error: null
        })
      } else {
        throw new Error(data.error || 'Failed to check configuration')
      }
    } catch (error) {
      console.error('Error checking configuration:', error)
      setConfigStatus(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }

  useEffect(() => {
    checkConfig()
  }, [])

  return { configStatus, refreshConfig: checkConfig }
}