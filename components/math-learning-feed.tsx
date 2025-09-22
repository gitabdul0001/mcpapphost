"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calculator,
  Send,
  LogOut,
  ExternalLink,
  BookOpen,
  TrendingUp,
  Infinity,
  PieChart,
  Zap,
  Plus,
  Search,
} from "lucide-react"

interface MathNewsItem {
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

const MATH_TOPICS = [
  { id: "algebra", label: "Algebra", icon: Calculator },
  { id: "calculus", label: "Calculus", icon: TrendingUp },
  { id: "geometry", label: "Geometry", icon: PieChart },
  { id: "statistics", label: "Statistics", icon: PieChart },
  { id: "number-theory", label: "Number Theory", icon: Infinity },
  { id: "applied-math", label: "Applied Math", icon: Zap },
]

export function MathLearningFeed() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [customTopic, setCustomTopic] = useState("")
  const [mathNews, setMathNews] = useState<MathNewsItem[]>([])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showTopicSelection, setShowTopicSelection] = useState(true)
  const [shownUrls, setShownUrls] = useState<string[]>([])
  const [searchOffset, setSearchOffset] = useState(0)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Welcome to your daily mathematics learning hub! 📚 Please select the topics you'd like to explore today, or add your own custom topics.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ])

  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics((prev) => (prev.includes(topicId) ? prev.filter((id) => id !== topicId) : [...prev, topicId]))
  }

  const handleAddCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.toLowerCase())) {
      setSelectedTopics((prev) => [...prev, customTopic.toLowerCase()])
      setCustomTopic("")
    }
  }

  const handleStartLearning = () => {
    if (selectedTopics.length > 0) {
      setShowTopicSelection(false)
      setShownUrls([])
      setSearchOffset(0)
      handleFindMathNews()
    }
  }

  const handleFindMathNews = async () => {
    setIsLoading(true)

    const mathQuery = `latest mathematics ${selectedTopics.join(" ")} research breakthrough discovery news within 2 weeks recent`

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: mathQuery,
          topics: selectedTopics,
          originalQuery: "Find latest mathematics news",
          findMore: false,
          excludeUrls: shownUrls,
          searchOffset: 0,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      if (data.newsItems && data.newsItems.length > 0) {
        const mathNewsItems: MathNewsItem[] = data.newsItems.map((item: any) => ({
          ...item,
          category: selectedTopics[0] || "mathematics",
        }))
        setMathNews(mathNewsItems)

        const newUrls = mathNewsItems.map((item) => item.url).filter(Boolean) as string[]
        setShownUrls((prev) => [...prev, ...newUrls])
        setSearchOffset(mathNewsItems.length)
      }

      // Add AI response to chat
      const assistantMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: data.response || "I've found some interesting mathematics content for you! Check out the feed below.",
        timestamp: new Date().toLocaleTimeString(),
      }
      setChatMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content:
          "I'm having trouble finding mathematics news right now. Let me try a different approach or ask me about a specific math topic!",
        timestamp: new Date().toLocaleTimeString(),
      }
      setChatMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleFindMore = async () => {
    setIsLoading(true)

    const mathQuery = `more latest mathematics ${selectedTopics.join(" ")} research breakthrough discovery news recent`

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: mathQuery,
          topics: selectedTopics,
          originalQuery: "Find more mathematics news",
          findMore: true,
          excludeUrls: shownUrls,
          searchOffset: searchOffset,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      if (data.newsItems && data.newsItems.length > 0) {
        const newMathNews: MathNewsItem[] = data.newsItems.map((item: any) => ({
          ...item,
          category: selectedTopics[0] || "mathematics",
        }))

        const uniqueNews = newMathNews.filter(
          (newItem) => !mathNews.some((existingItem) => existingItem.url === newItem.url),
        )

        if (uniqueNews.length > 0) {
          setMathNews((prev) => [...prev, ...uniqueNews])

          const newUrls = uniqueNews.map((item) => item.url).filter(Boolean) as string[]
          setShownUrls((prev) => [...prev, ...newUrls])
          setSearchOffset((prev) => prev + uniqueNews.length)
        }
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
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
      const mathQuery = `latest mathematics ${currentMessage} research education news breakthrough recent`

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: mathQuery,
          topics: selectedTopics,
          originalQuery: currentMessage,
          findMore: false,
          excludeUrls: shownUrls,
          searchOffset: 0,
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

      // Update news if new items found
      if (data.newsItems && data.newsItems.length > 0) {
        const newMathNews: MathNewsItem[] = data.newsItems.map((item: any) => ({
          ...item,
        }))

        const uniqueNews = newMathNews.filter(
          (newItem) => !mathNews.some((existingItem) => existingItem.url === newItem.url),
        )

        if (uniqueNews.length > 0) {
          setMathNews((prev) => [...uniqueNews, ...prev].slice(0, 20)) // Keep latest 20 items

          const newUrls = uniqueNews.map((item) => item.url).filter(Boolean) as string[]
          setShownUrls((prev) => [...prev, ...newUrls])
        }
      }
    } catch (error) {
      console.error("Error:", error)
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: "Sorry, I encountered an error while searching for mathematics content. Please try again.",
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

  const handleBackToTopics = () => {
    setShowTopicSelection(true)
    setMathNews([])
    setSelectedTopics([])
    setShownUrls([])
    setSearchOffset(0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg">
                <img src="/logo.png" alt="MyDailyMath Logo" className="h-8 w-8 object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-bold">MyDailyMath</h1>
                <p className="text-sm text-muted-foreground">Your daily mathematics learning hub</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!showTopicSelection && (
                <Button variant="outline" size="sm" onClick={handleBackToTopics}>
                  <BookOpen className="h-4 w-4 mr-2" />
                  Change Topics
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {showTopicSelection ? (
          <div className="max-w-2xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6" />
                  What would you like to learn today?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-3">Popular Math Topics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {MATH_TOPICS.map((topic) => {
                      const Icon = topic.icon
                      const isSelected = selectedTopics.includes(topic.id)
                      return (
                        <button
                          key={topic.id}
                          onClick={() => handleTopicToggle(topic.id)}
                          className={`custom-button ${
                            isSelected
                              ? "custom-button-green"
                              : [
                                  "custom-button",
                                  "custom-button-orange",
                                  "custom-button-blue",
                                  "custom-button-purple",
                                  "custom-button-red",
                                ][Math.floor(Math.random() * 5)]
                          } flex items-center gap-2 h-auto py-4 text-sm`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{topic.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Add Custom Topic</h3>
                  <div className="flex gap-2">
                    <Input
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      placeholder="e.g., Linear Algebra, Topology, Game Theory..."
                      onKeyPress={(e) => e.key === "Enter" && handleAddCustomTopic()}
                    />
                    <button onClick={handleAddCustomTopic} className="custom-button custom-button-green p-3">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {selectedTopics.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Selected Topics</h3>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedTopics.map((topicId) => {
                        const topic = MATH_TOPICS.find((t) => t.id === topicId)
                        return (
                          <Badge key={topicId} variant="secondary" className="px-3 py-1">
                            {topic ? topic.label : topicId}
                          </Badge>
                        )
                      })}
                    </div>
                    <button onClick={handleStartLearning} className="custom-button custom-button-blue w-full text-lg">
                      <Search className="h-4 w-4 mr-2" />
                      Start Learning ({selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""})
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* AI Chat Input */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar>
                    <AvatarFallback className="bg-blue-500 text-white">AI</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Ask about any mathematics topic..."
                        disabled={isLoading}
                        className="flex-1"
                      />
                      <button
                        type="submit"
                        disabled={isLoading || !inputMessage.trim()}
                        className="custom-button custom-button-orange p-3"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </form>
                  </div>
                </div>

                {/* Chat Messages */}
                <ScrollArea className="h-32 mb-4">
                  <div className="space-y-3">
                    {chatMessages.slice(-3).map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-lg p-3 ${
                            message.type === "user" ? "bg-blue-500 text-white" : "bg-muted"
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
                          <p className="text-sm">Searching mathematics content...</p>
                          <div className="flex items-center gap-1 mt-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.1s" }}
                            ></div>
                            <div
                              className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* News Feed */}
            <div className="space-y-4">
              {mathNews.length > 0 ? (
                <>
                  {mathNews.map((item) => (
                    <Card
                      key={item.id}
                      className="custom-card hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500"
                    >
                      <CardContent className="pt-6">
                        <div className="space-y-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-xs font-medium">
                                  {item.source}
                                </Badge>
                                <span>•</span>
                                <span>{item.publishedAt}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {item.category}
                                </Badge>
                              </div>

                              <h3 className="font-bold text-lg leading-tight text-balance hover:text-blue-600 transition-colors">
                                {item.title}
                              </h3>

                              <p className="text-muted-foreground leading-relaxed text-pretty">{item.summary}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-end pt-2 border-t">
                            {item.url && (
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="custom-button custom-button-blue gap-2 inline-flex items-center text-sm"
                              >
                                <ExternalLink className="h-4 w-4" />
                                Read Full Article
                              </a>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Card className="border-dashed">
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <button
                          onClick={handleFindMore}
                          disabled={isLoading}
                          className="custom-button custom-button-purple gap-2 inline-flex items-center text-lg"
                        >
                          <Search className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                          {isLoading ? "Finding More Content..." : "Find More Content"}
                        </button>
                        <p className="text-sm text-muted-foreground mt-2">Discover more latest mathematics content</p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-12">
                      <Calculator className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                      <h3 className="font-semibold mb-2">Finding Latest Mathematics Content</h3>
                      <p className="text-muted-foreground mb-4">
                        Searching for the most recent developments in your selected topics...
                      </p>
                      {isLoading && (
                        <div className="flex items-center justify-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
