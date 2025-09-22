"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from "lucide-react"
import { MathLearningFeed } from "@/components/math-learning-feed"

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    // Simulate loading for 1 second
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Fixed credentials check
    if (username === "Project123" && password === "Project123") {
      setIsAuthenticated(true)
    } else {
      setError("Invalid credentials. Please check your username and password.")
    }

    setIsLoading(false)
  }

  if (isAuthenticated) {
    return <MathLearningFeed />
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="mb-6 flex items-center gap-3 px-6 py-3 bg-black text-white rounded-lg border-4 border-black hover:bg-gray-800 transition-colors">
        <img src="/hackathon-badge.png" alt="Hackathon Badge" className="h-8 w-8 object-contain" />
        <span className="font-bold text-sm">Built for CodeTV x Postman Hackathon</span>
      </div>

      <Card className="w-full max-w-md custom-card">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full">
              <img src="/logo.png" alt="MyDailyMath Logo" className="h-12 w-12 object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">MyDailyMath</CardTitle>
          <CardDescription>Your AI-powered mathematics learning hub</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <Lock className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <button type="submit" className="custom-button custom-button-blue w-full text-lg" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing In...
                </div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
