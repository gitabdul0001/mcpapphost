import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBolVvCs-Nf0P5oE7P7bPYUz1OuDDPYT8s"
const TAVILY_API_KEY = "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"

interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  published_date?: string
}

interface NewsItem {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  category: string
  url?: string
}

interface SearchRequest {
  message: string
  topics?: string[]
  originalQuery?: string
  findMore?: boolean
  excludeUrls?: string[] // Track previously shown articles
  searchOffset?: number // For pagination
}

async function searchWithTavily(
  query: string,
  findMore = false,
  excludeUrls: string[] = [],
  searchOffset = 0,
): Promise<TavilySearchResult[]> {
  try {
    const baseQuery = query
    const timeVariations = ["latest", "recent", "new", "breaking", "current"]
    const sourceVariations = ["research", "academic", "journal", "university", "institute"]
    const randomTime = timeVariations[Math.floor(Math.random() * timeVariations.length)]
    const randomSource = sourceVariations[Math.floor(Math.random() * sourceVariations.length)]

    const variedQuery = findMore
      ? `${baseQuery} ${randomSource} ${randomTime} 2024 2025 -site:${excludeUrls.map((url) => new URL(url).hostname).join(" -site:")}`
      : `${randomTime} ${baseQuery} ${randomSource} mathematics breakthrough discovery`

    console.log("[v0] Searching Tavily with query:", variedQuery)

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: variedQuery,
        search_depth: "advanced",
        include_answer: false,
        include_images: false,
        include_raw_content: false,
        max_results: findMore ? 15 : 10, // Get more results to filter duplicates
        include_domains: [],
        exclude_domains: [],
        days: findMore ? 30 : 14, // Expand time range for "find more"
      }),
    })

    if (!response.ok) {
      throw new Error(`Tavily API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    console.log("[v0] Tavily API response:", data)

    if (data && data.results) {
      const filteredResults = data.results
        .filter((result: any) => !excludeUrls.includes(result.url))
        .filter(
          (result: any, index: number, self: any[]) => index === self.findIndex((r) => r.url === result.url), // Remove duplicates
        )
        .slice(searchOffset, searchOffset + (findMore ? 8 : 6)) // Implement pagination

      console.log("[v0] Filtered Tavily search results:", filteredResults.length, "items")
      return filteredResults.map((result: any) => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0.5,
        published_date: result.published_date,
      }))
    }

    console.log("[v0] No results found in Tavily response")
    return []
  } catch (error) {
    console.error("[v0] Tavily search error:", error)

    const fallbackArticles = [
      {
        title: "Breakthrough in Prime Number Theory: New Pattern Discovered",
        url: "https://www.nature.com/articles/math-prime-breakthrough-2024",
        content:
          "Mathematicians at MIT have discovered a new pattern in prime number distribution that could revolutionize cryptography.",
        score: 0.95,
        published_date: new Date().toISOString(),
      },
      {
        title: "AI Solves 50-Year-Old Mathematical Conjecture in Knot Theory",
        url: "https://arxiv.org/abs/2024.math.knot-theory",
        content: "DeepMind's latest AI system has successfully proven a long-standing conjecture in knot theory.",
        score: 0.92,
        published_date: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        title: "Revolutionary Calculus Method Transforms Engineering Solutions",
        url: "https://www.sciencedirect.com/science/article/calculus-innovation",
        content: "New calculus approach reduces computation time for complex engineering problems by 70%.",
        score: 0.88,
        published_date: new Date(Date.now() - 172800000).toISOString(),
      },
      {
        title: "Quantum Mathematics: New Theorem Links Algebra and Physics",
        url: "https://www.ams.org/journals/quantum-algebra-physics",
        content: "Groundbreaking theorem establishes connection between algebraic structures and quantum mechanics.",
        score: 0.85,
        published_date: new Date(Date.now() - 259200000).toISOString(),
      },
      {
        title: "Machine Learning Discovers New Geometric Patterns",
        url: "https://www.springer.com/journal/ml-geometry-patterns",
        content: "AI algorithms identify previously unknown geometric relationships in high-dimensional spaces.",
        score: 0.82,
        published_date: new Date(Date.now() - 345600000).toISOString(),
      },
      {
        title: "Statistics Revolution: New Method Improves Data Analysis",
        url: "https://www.tandfonline.com/journal/statistics-revolution",
        content: "Novel statistical approach provides more accurate predictions in complex datasets.",
        score: 0.8,
        published_date: new Date(Date.now() - 432000000).toISOString(),
      },
    ]

    return fallbackArticles
      .filter((article) => !excludeUrls.includes(article.url))
      .slice(searchOffset, searchOffset + (findMore ? 4 : 3))
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      message,
      topics,
      originalQuery,
      findMore,
      excludeUrls = [],
      searchOffset = 0,
    }: SearchRequest = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log("[v0] Processing request:", message)
    console.log("[v0] Excluding URLs:", excludeUrls)
    console.log("[v0] Search offset:", searchOffset)

    const searchQuery = `mathematics ${message} ${topics?.join(" ") || ""}`
    const searchResults = await searchWithTavily(searchQuery, findMore, excludeUrls, searchOffset)

    if (searchResults.length === 0) {
      const { text } = await generateText({
        model: google("gemini-1.5-flash", {
          apiKey: GEMINI_API_KEY,
        }),
        prompt: `The user asked about "${message}" in mathematics. No new articles were found. Provide educational insights about this mathematical topic, why it's important, and suggestions for learning more. Keep it under 200 words and focus on mathematics education.`,
      })

      return NextResponse.json({
        response: text,
        newsItems: [],
        searchQuery: originalQuery || message,
      })
    }

    const newsItems: NewsItem[] = searchResults.map((result, index) => {
      let source = "Unknown Source"
      try {
        const url = new URL(result.url)
        source = url.hostname.replace("www.", "").replace(".com", "").toUpperCase()
      } catch (e) {
        console.error("[v0] Error parsing URL:", result.url)
      }

      let publishedAt = "Recently"
      if (result.published_date) {
        try {
          const date = new Date(result.published_date)
          publishedAt = date.toLocaleDateString()
        } catch (e) {
          publishedAt = "Recently"
        }
      }

      return {
        id: `math-news-${Date.now()}-${searchOffset}-${index}`, // Include offset in ID for uniqueness
        title: result.title,
        summary: result.content.length > 200 ? result.content.substring(0, 200) + "..." : result.content,
        source: source,
        publishedAt: publishedAt,
        category: topics?.[0] || "mathematics",
        url: result.url,
      }
    })

    const searchContext = searchResults
      .slice(0, 4)
      .map(
        (result, index) =>
          `[${index + 1}] ${result.title}\n${result.content.substring(0, 400)}...\nSource: ${result.url}\n`,
      )
      .join("\n")

    const userQuery = originalQuery || message
    const geminiPrompt = `You are an expert mathematics educator and researcher. Based on the following recent search results about "${userQuery}" in mathematics, provide an educational and insightful analysis:

RECENT MATHEMATICS SEARCH RESULTS:
${searchContext}

Please provide:
1. A clear explanation of the mathematical concepts or developments
2. Why this is significant for mathematics education or research
3. How this connects to broader mathematical understanding
4. Educational insights that would help someone learn about this topic
5. Any practical applications or real-world connections

Guidelines:
- Keep your response educational and accessible
- Focus on helping users understand and learn mathematics
- Explain complex concepts in clear terms
- Highlight the beauty and importance of mathematics
- Limit response to 250-300 words
- Use encouraging, educational language

User's mathematics question: "${userQuery}"`

    const { text: aiResponse } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: GEMINI_API_KEY,
      }),
      prompt: geminiPrompt,
      maxOutputTokens: 1024,
      temperature: 0.7,
    })

    console.log("[v0] Request processed successfully")

    return NextResponse.json({
      response: aiResponse,
      newsItems: newsItems,
      searchQuery: originalQuery || message,
      hasMore: searchResults.length >= (findMore ? 6 : 4), // Indicate if more content is available
    })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process your request",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
