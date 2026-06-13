import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata requisições OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    const { 
      action = 'generateText', 
      prompt, 
      audioBase64, 
      audioMimeType = 'audio/mp3',
      model = 'gemini-2.5-flash', 
      temperature = 0.2, 
      responseMimeType 
    } = payload

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'A variável de ambiente GEMINI_API_KEY não está configurada no Supabase.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
    
    let geminiPayload: any = {}

    if (action === 'analyzeAudio' && audioBase64) {
      geminiPayload = {
        contents: [
          {
            parts: [
              {
                inlineData: {
                  mimeType: audioMimeType,
                  data: audioBase64
                }
              },
              {
                text: prompt || "Transcreva este áudio em português e analise a gravidade do risco clínico de crise."
              }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
        }
      }
    } else {
      // Padrão: Prompt de texto comum
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'O prompt é obrigatório para geração de texto.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      geminiPayload = {
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: temperature,
        }
      }
    }

    if (responseMimeType) {
      geminiPayload.generationConfig.responseMimeType = responseMimeType
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(geminiPayload),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Erro na API do Gemini:', errText)
      return new Response(
        JSON.stringify({ error: 'Falha na comunicação com a API do Gemini.', details: errText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return new Response(
      JSON.stringify({ text }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
