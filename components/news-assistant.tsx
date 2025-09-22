"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Newspaper,
  Send,
  X,
  TrendingUp,
  Globe,
  Briefcase,
  Heart,
  Cpu,
  LogOut,
  ExternalLink,
  Plus,
  Sparkles,
} from "lucide-react"

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  category: string
  url?: string
}

interface ChatMessage {
  id: string
  type: "user" | "assistant"
  content: string
  timestamp: string
}

interface CustomTopic {
  id: string
  label: string
  keywords: string[]
}

const TOPIC_ICONS = {
  technology: Cpu,
  business: Briefcase,
  health: Heart,
  world: Globe,
  trending: TrendingUp,
  custom: Sparkles,
}

export function NewsAssistant() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>(["technology"])
  const [customTopics, setCustomTopics] = useState<CustomTopic[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hello! I'm your AI news assistant powered by Gemini and Tavily. What topics would you like me to search for today? You can select from the predefined topics or create your own custom topics.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [newTopicName, setNewTopicName] = useState("")
  const [newTopicKeywords, setNewTopicKeywords] = useState("")
  const [isAddingTopic, setIsAddingTopic] = useState(false)

  const availableTopics = [
    { id: "technology", label: "Technology", icon: Cpu },
    { id: "business", label: "Business", icon: Briefcase },
    { id: "health", label: "Health", icon: Heart },
    { id: "world", label: "World News", icon: Globe },
    { id: "trending", label: "Trending", icon: TrendingUp },
  ]

  // Load custom topics from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("customTopics")
    if (saved) {
      try {
        setCustomTopics(JSON.parse(saved))
      } catch (error) {
        console.error("Failed to load custom topics:", error)
      }
    }
  }, [])

  // Save custom topics to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("customTopics", JSON.stringify(customTopics))
  }, [customTopics])

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const handleAddCustomTopic = () => {
    if (!newTopicName.trim()) return

    const keywords = newTopicKeywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k.length > 0)

    const newTopic: CustomTopic = {
      id: `custom-${Date.now()}`,
      label: newTopicName.trim(),
      keywords: keywords.length > 0 ? keywords : [newTopicName.trim()],
    }

    setCustomTopics((prev) => [...prev, newTopic])
    setSelectedTopics((prev) => [...prev, newTopic.id])
    setNewTopicName("")
    setNewTopicKeywords("")
    setIsAddingTopic(false)
  }

  const handleRemoveCustomTopic = (topicId: string) => {
    setCustomTopics((prev) => prev.filter((topic) => topic.id !== topicId))
    setSelectedTopics((prev) => prev.filter((id) => id !== topicId))
  }

  const getTopicKeywords = (topicId: string): string[] => {
    const customTopic = customTopics.find((t) => t.id === topicId)
    if (customTopic) return customTopic.keywords

    // Default keywords for built-in topics
    const keywordMap: Record<string, string[]> = {
      technology: ["tech", "AI", "software", "innovation", "startup"],
      business: ["business", "economy", "finance", "market", "corporate"],
      health: ["health", "medical", "healthcare", "wellness", "medicine"],
      world: ["international", "global", "politics", "diplomacy"],
      trending: ["viral", "popular", "breaking", "latest"],
    }

    return keywordMap[topicId] || [topicId]
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    const currentMessage = inputMessage
    setInputMessage("")
    setIsLoading(true)

    try {
      // Enhance the search query with topic keywords
      const topicKeywords = selectedTopics.flatMap(getTopicKeywords)
      const enhancedQuery = `${currentMessage} ${topicKeywords.join(" ")}`

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: enhancedQuery,
          topics: selectedTopics,
          originalQuery: currentMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.response,
        timestamp: new Date().toLocaleTimeString(),
      }

      setChatMessages((prev) => [...prev, assistantMessage])

      // Update news items with real search results
      if (data.newsItems && data.newsItems.length > 0) {
        setNewsItems(data.newsItems)
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error while searching for news. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    window.location.reload()
  }

  const allTopics = [...availableTopics, ...customTopics.map((topic) => ({ ...topic, icon: Sparkles }))]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Newspaper className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h1 className="text-xl font-bold">AI News Assistant</h1>
                <p className="text-sm text-muted-foreground">Powered by Gemini & Tavily</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Topics Selection */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Your Interests</CardTitle>
                  <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Topic
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Custom Topic</DialogTitle>
                        <DialogDescription>
                          Create a personalized topic to get news about specific subjects you're interested in.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="topic-name">Topic Name</Label>
                          <Input
                            id="topic-name"
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            placeholder="e.g., Climate Change, Space Exploration"
                          />
                        </div>
                        <div>
                          <Label htmlFor="topic-keywords">Keywords (optional)</Label>
                          <Textarea
                            id="topic-keywords"
                            value={newTopicKeywords}
                            onChange={(e) => setNewTopicKeywords(e.target.value)}
                            placeholder="e.g., renewable energy, carbon emissions, sustainability"
                            rows={3}
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Separate keywords with commas to improve search results
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleAddCustomTopic} disabled={!newTopicName.trim()}>
                            Add Topic
                          </Button>
                          <Button variant="outline" onClick={() => setIsAddingTopic(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTopics.map((topic) => {
                    const Icon = topic.icon
                    const isSelected = selectedTopics.includes(topic.id)
                    const isCustom = topic.id.startsWith("custom-")
                    return (
                      <div key={topic.id} className="relative group">
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleTopicToggle(topic.id)}
                          className="flex items-center gap-2 pr-8"
                        >
                          <Icon className="h-4 w-4" />
                          {topic.label}
                          {isSelected && <X className="h-3 w-3" />}
                        </Button>
                        {isCustom && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveCustomTopic(topic.id)
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )
                  })}
                </div>
                {selectedTopics.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select at least one topic to personalize your news feed
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* News Feed */}
          <div className="lg:col-span-2">
            <Card className="h-[600px]">
              <CardHeader>
                <CardTitle>Latest News</CardTitle>
                {selectedTopics.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Showing news for:{" "}
                    {selectedTopics
                      .map((id) => {
                        const topic = allTopics.find((t) => t.id === id)
                        return topic?.label
                      })
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {newsItems.length > 0 ? (
                    <div className="space-y-4">
                      {newsItems.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="secondary">{item.category}</Badge>
                            <span className="text-xs text-muted-foreground">{item.publishedAt}</span>
                          </div>
                          <h3 className="font-semibold mb-2 text-balance">{item.title}</h3>
                          <p className="text-sm text-muted-foreground mb-3 text-pretty">{item.summary}</p>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-muted-foreground">Source: {item.source}</p>
                            {item.url && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={item.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Read More
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Newspaper className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Ask me about any topic to get started!</p>
                        <p className="text-xs mt-2">
                          I'll search the latest news using Tavily and analyze it with Gemini AI
                        </p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* AI Chat */}
          <div className="lg:col-span-1">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle>AI Assistant</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 mb-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.type === "user" ? "bg-accent text-accent-foreground" : "bg-muted"
                          }`}
                        >
                          <p className="text-sm text-pretty">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-3">
                          <p className="text-sm">Searching with Tavily and analyzing with Gemini...</p>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-accent rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-accent rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-accent rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask about any topic..."
                    disabled={isLoading}
                  />
                  <Button type="submit" size="icon" disabled={isLoading || !inputMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
