'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Send, User, Bot, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewName } from '@/app/page'

interface Msg {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  onOpenProcess: (id: string) => void
  onNavigate: (v: ViewName) => void
}

const SUGGESTOES = [
  'Quais são meus prazos desta semana?',
  'Quais clientes estão inadimplentes?',
  'Resuma o processo João Santos vs Construtora Horizonte',
  'Quais audiências tenho amanhã?',
  'Liste todos os processos trabalhistas ativos',
  'Gere um relatório financeiro de junho',
  'Quais processos estão parados há mais de 90 dias?',
  'Sugira argumentos para a réplica do processo Maria Aparecida vs Banco XYZ',
]

export function CopilotView({ onNavigate }: Props) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: 'assistant',
      content:
        'Olá! Sou o **Copiloto Jurídico** do JusFlow. Tenho acesso em tempo real aos dados do seu escritório: clientes, processos, prazos, tarefas, honorários e financeiro. \n\nPosso ajudar a:\n• Resumir processos\n• Listar prazos e audiências\n• Identificar inadimplências\n• Sugerir petições e argumentos\n• Gerar relatórios\n\nO que você gostaria de saber?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async (text?: string) => {
    const pergunta = (text || input).trim()
    if (!pergunta || loading) return

    const newUserMsg: Msg = { role: 'user', content: pergunta }
    const newMsgs = [...messages, newUserMsg]
    setMessages(newMsgs)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pergunta,
          historico: newMsgs.slice(-6, -1).map((m) => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.resposta || data.error || 'Sem resposta.' }])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Desculpe, ocorreu um erro de conexão. Tente novamente.' },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                'flex gap-3',
                m.role === 'user' && 'flex-row-reverse'
              )}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                  m.role === 'assistant'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {m.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>
              <div
                className={cn(
                  'rounded-lg px-4 py-3 max-w-[85%] space-y-1',
                  m.role === 'assistant'
                    ? 'bg-card border border-border'
                    : 'bg-primary text-primary-foreground'
                )}
              >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">
                  {formatMarkdown(m.content)}
                </div>
                {m.role === 'assistant' && i === 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border mt-2">
                    {SUGGESTOES.slice(0, 4).map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-[11px] px-2 py-1 rounded-md bg-muted hover:bg-accent text-foreground border border-border"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-lg px-4 py-3 bg-card border border-border flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Consultando dados do escritório...</span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div className="border-t border-border bg-muted/30 p-3">
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Tente perguntar
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {SUGGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-[13px] px-3 py-2 rounded-md bg-card hover:bg-accent border border-border transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-background p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Pergunte sobre seus processos, clientes, prazos, financeiro..."
              rows={1}
              className="min-h-[44px] max-h-32 resize-none"
              disabled={loading}
            />
            <Button onClick={() => send()} disabled={!input.trim() || loading} size="icon" className="h-11 w-11 shrink-0">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            O Copiloto usa IA generativa com acesso aos dados do seu escritório (RAG). Sempre valide as respostas.
          </p>
        </div>
      </div>
    </div>
  )
}

// Renderiza markdown simples: **bold**, *italic*, listas, headings
function formatMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    // Bold inline
    const parts: React.ReactNode[] = []
    const regex = /\*\*(.+?)\*\*/g
    let lastIndex = 0
    let match
    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index))
      parts.push(<strong key={match.index}>{match[1]}</strong>)
      lastIndex = regex.lastIndex
    }
    if (lastIndex < line.length) parts.push(line.slice(lastIndex))

    if (line.startsWith('• ') || line.startsWith('- ')) {
      return (
        <div key={i} className="flex gap-2">
          <span className="text-primary">•</span>
          <span>{parts}</span>
        </div>
      )
    }
    if (/^\d+\.\s/.test(line)) {
      return <div key={i} className="ml-1">{parts}</div>
    }
    return <div key={i}>{parts.length ? parts : '\u00A0'}</div>
  })
}
