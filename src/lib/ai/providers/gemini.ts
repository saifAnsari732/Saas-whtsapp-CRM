import { GoogleGenerativeAI } from '@google/generative-ai'
import { AiError, type AiUsage } from '../types'
import { type GenerateArgs } from '../generate'

export async function generateGemini(
  args: Omit<GenerateArgs, 'config'> & { apiKey: string; model: string; timeoutMs?: number },
): Promise<{ text: string; usage: AiUsage }> {
  const { apiKey, model, systemPrompt, messages } = args

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    
    // Default to gemini-1.5-flash if model string is generic
    const modelName = model === 'gemini' ? 'gemini-1.5-flash' : model
    
    const generativeModel = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const lastMessage = messages[messages.length - 1]

    const chat = generativeModel.startChat({
      history: history,
    })

    const result = await chat.sendMessage(lastMessage.content)
    const response = result.response
    
    const text = response.text()
    
    const usage = {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
    }

    return { text, usage }
  } catch (err: unknown) {
    if (err instanceof Error && (err.message?.includes('API key not valid') || (err as {status?: number}).status === 401)) {
      throw new AiError('Invalid Gemini API key', {
        code: 'provider_auth',
        status: 401,
      })
    }
    throw new AiError('Gemini generation failed', {
      code: 'provider_error',
      status: 500,
    })
  }
}
