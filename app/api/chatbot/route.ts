import { google } from "@ai-sdk/google"
import { generateText } from "ai"
import { type NextRequest, NextResponse } from "next/server"

const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "AIzaSyBolVvCs-Nf0P5oE7P7bPYUz1OuDDPYT8s"

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

interface ChatRequest {
  message: string
  history?: ChatMessage[]
}

export async function POST(request: NextRequest) {
  try {
    const { message, history = [] }: ChatRequest = await request.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    console.log("[v0] Chatbot processing message:", message)

    // Build conversation context from history
    const conversationContext = history
      .slice(-6) // Keep last 6 messages for context
      .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
      .join("\n")

    const systemPrompt = `You are a helpful AI assistant for MyDailyMath platform. You can help users with:
- Mathematics questions and explanations
- General questions about any topic
- Learning guidance and study tips
- Problem-solving assistance
- Educational support

Guidelines:
- Be friendly, helpful, and encouraging
- Explain complex concepts in simple terms
- Provide step-by-step solutions when appropriate
- If asked about mathematics, be thorough but accessible
- For non-math questions, be informative and helpful
- Keep responses concise but complete (under 300 words)
- Use a warm, educational tone

${conversationContext ? `Previous conversation:\n${conversationContext}\n` : ""}

User's current question: "${message}"`

    const { text: aiResponse } = await generateText({
      model: google("gemini-1.5-flash", {
        apiKey: GEMINI_API_KEY,
      }),
      prompt: systemPrompt,
      maxOutputTokens: 1024,
      temperature: 0.7,
    })

    console.log("[v0] Chatbot response generated successfully")

    return NextResponse.json({
      response: aiResponse,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[v0] Chatbot API error:", error)
    return NextResponse.json(
      {
        error: "Failed to process your message",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
