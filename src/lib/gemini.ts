import { GoogleGenAI } from '@google/genai'

interface GenerateParams {
  contents: any
  systemInstruction?: string
  temperature?: number
}

/**
 * Executes a Gemini content generation call with automatic retries and exponential backoff
 * to handle temporary issues such as 503 UNAVAILABLE, 429 Rate Limit, and high demand spikes.
 */
export async function generateContentWithRetry(params: GenerateParams): Promise<string> {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })

  // We default to 'gemini-3.5-flash' for general text generation
  const modelName = 'gemini-3.5-flash'
  let delay = 1000 // initial 1 second delay
  let lastError: any = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: params.contents,
        config: {
          systemInstruction: params.systemInstruction,
          temperature: params.temperature ?? 0.4,
        },
      })

      if (response && response.text) {
        return response.text
      }
      
      throw new Error('A API do Gemini retornou uma resposta vazia.')
    } catch (err: any) {
      lastError = err
      const errMessage = String(err?.message || err?.status || err || '').toLowerCase()
      console.warn(`[Gemini API] Tentativa ${attempt} falhou para o modelo ${modelName}:`, err)

      const isTemporary =
        errMessage.includes('503') ||
        errMessage.includes('unavailable') ||
        errMessage.includes('429') ||
        errMessage.includes('rate limit') ||
        errMessage.includes('demand') ||
        errMessage.includes('fetch') ||
        errMessage.includes('network') ||
        errMessage.includes('overloaded')

      if (!isTemporary) {
        // If it's a structural error (e.g. invalid API key or bad prompt parameters), fail fast
        break
      }

      if (attempt < 3) {
        console.log(`[Gemini API] Aguardando ${delay}ms antes da próxima tentativa...`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        delay *= 2 // Exponential backoff
      }
    }
  }

  // If we couldn't get a response, throw the last error
  throw lastError || new Error('Não foi possível gerar resposta devido a falhas temporárias na API do Gemini.')
}
