"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Key, 
  Copy, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle,
  Zap,
  Settings,
  Code
} from 'lucide-react'

console.log('Setup instructions component initialized');

export default function SetupInstructions() {
  const [copiedItems, setCopiedItems] = useState<string[]>([])

  const copyToClipboard = (text: string, itemId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedItems(prev => [...prev, itemId])
    setTimeout(() => {
      setCopiedItems(prev => prev.filter(id => id !== itemId))
    }, 2000)
  }

  const isCopied = (itemId: string) => copiedItems.includes(itemId)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-4">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Settings className="w-4 h-4 mr-2" />
            Configuration Required
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Complete Your AI Setup
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            To unlock the full power of PassInterview.AI, you need to configure your OpenAI API key. 
            This enables advanced document analysis and intelligent interview responses.
          </p>
        </div>

        {/* Configuration Status */}
        <Alert className="mb-8 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800 dark:text-orange-200">
            <strong>AI Features Currently Limited:</strong> The application is running in fallback mode. 
            Enhanced document analysis and intelligent responses require OpenAI API configuration.
          </AlertDescription>
        </Alert>

        <div className="grid gap-8">
          
          {/* Step 1: Get OpenAI API Key */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">1</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Get Your OpenAI API Key
                  </CardTitle>
                  <CardDescription>
                    Create an account and get your API key from OpenAI
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Quick Setup:</h4>
                <ol className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-mono">1.</span>
                    Visit{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                    >
                      OpenAI API Keys <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-mono">2.</span>
                    Sign up or log in to your OpenAI account
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-mono">3.</span>
                    Click "Create new secret key" and copy it
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 font-mono">4.</span>
                    Make sure you have billing set up (required for API usage)
                  </li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Cost Information:</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  This app uses GPT-4o-mini, which costs approximately $0.0001-0.0003 per request. 
                  A typical interview session (10-15 questions) costs less than $0.01.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Configure Environment */}
          <Card className="border-2 border-green-200 dark:border-green-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold">2</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Configure Environment Variables
                  </CardTitle>
                  <CardDescription>
                    Add your API key to the environment configuration
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Edit .env.local file:</h4>
                  <Badge variant="outline">Root directory</Badge>
                </div>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm overflow-x-auto">
                  <div className="flex items-center justify-between">
                    <span>OPENAI_API_KEY=your_openai_api_key_here</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard('OPENAI_API_KEY=your_openai_api_key_here', 'env-line')}
                      className="text-green-400 hover:text-green-300 h-6 px-2"
                    >
                      {isCopied('env-line') ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Replace "your_openai_api_key_here" with your actual API key from step 1
                </p>
              </div>

              <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  <strong>Security Note:</strong> Never commit your .env.local file to version control. 
                  It's already included in .gitignore for your protection.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Step 3: Restart Application */}
          <Card className="border-2 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">3</span>
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Restart & Enjoy AI Features
                  </CardTitle>
                  <CardDescription>
                    Restart the development server to apply changes
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <h4 className="font-semibold mb-2">Restart Command:</h4>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                  <div className="flex items-center justify-between">
                    <span>npm run dev</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard('npm run dev', 'restart-cmd')}
                      className="text-green-400 hover:text-green-300 h-6 px-2"
                    >
                      {isCopied('restart-cmd') ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">🚀 What You'll Get:</h4>
                <ul className="space-y-1 text-sm text-green-700 dark:text-green-300">
                  <li>• AI-powered document analysis with skill extraction</li>
                  <li>• Intelligent question categorization (technical, behavioral, etc.)</li>
                  <li>• Contextual responses using your actual career history</li>
                  <li>• Enhanced interview preparation and insights</li>
                  <li>• Real-time AI responses during live interview sessions</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Current Features Available */}
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-lg">Features Currently Available (Fallback Mode)</CardTitle>
              <CardDescription>
                These features work without OpenAI API configuration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-green-600">✅ Working Features:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• File upload and basic processing</li>
                    <li>• Interview session interface</li>
                    <li>• Speech-to-text functionality</li>
                    <li>• Basic response generation</li>
                    <li>• User authentication</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-orange-600">⏳ Requires API Key:</h4>
                  <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>• Advanced document analysis</li>
                    <li>• Intelligent question categorization</li>
                    <li>• Contextual AI responses</li>
                    <li>• Skills and experience extraction</li>
                    <li>• Career progression insights</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        <div className="text-center mt-8">
          <p className="text-gray-600 dark:text-gray-400">
            Need help? Check the{' '}
            <a 
              href="https://platform.openai.com/docs/quickstart" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800"
            >
              OpenAI documentation
            </a>{' '}
            for detailed setup instructions.
          </p>
        </div>

      </div>
    </div>
  )
}