'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalIcon, Clock, Gavel, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { priorityColor } from '@/lib/format'

type ViewMode = 'month' | 'week' | 'day'

interface Evento {
  id: string
  tipo: string
  titulo: string
  data: string
  prioridade: string
  responsavel: string | null
  processo: string | null
  cliente: string | null
  processId: string | null
  allDay: boolean
}

interface Props {
  onOpenProcess: (id: string) => void
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function iconForTipo(tipo: string) {
  switch (tipo) {
    case 'audiencia': return Gavel
    case 'prazo': return Clock
    case 'tarefa': return CheckSquare
    default: return CalIcon
  }
}

function colorForTipo(tipo: string) {
  switch (tipo) {
    case 'audiencia': return 'bg-red-500'
    case 'prazo': return 'bg-amber-500'
    case 'tarefa': return 'bg-purple-500'
    default: return 'bg-blue-500'
  }
}

export function AgendaView({ onOpenProcess }: Props) {
  const [mode, setMode] = useState<ViewMode>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [eventos, setEventos] = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const inicio = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    const fim = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
    setLoading(true)
    fetch(`/api/agenda?inicio=${inicio.toISOString()}&fim=${fim.toISOString()}`)
      .then((r) => r.json())
      .then((d) => setEventos(d.eventos || []))
      .finally(() => setLoading(false))
  }, [currentDate])

  const eventosPorDia: Record<string, Evento[]> = {}
  for (const e of eventos) {
    const key = new Date(e.data).toDateString()
    if (!eventosPorDia[key]) eventosPorDia[key] = []
    eventosPorDia[key].push(e)
  }

  const prev = () => {
    const d = new Date(currentDate)
    if (mode === 'month') d.setMonth(d.getMonth() - 1)
    else if (mode === 'week') d.setDate(d.getDate() - 7)
    else d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }
  const next = () => {
    const d = new Date(currentDate)
    if (mode === 'month') d.setMonth(d.getMonth() + 1)
    else if (mode === 'week') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }
  const today = () => setCurrentDate(new Date())

  // === VIEW MENSAL ===
  const renderMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const days: (number | null)[] = []
    for (let i = 0; i < firstDay; i++) days.push(null)
    for (let d = 1; d <= daysInMonth; d++) days.push(d)

    return (
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2">
            {d}
          </div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={i} className="min-h-[88px] rounded-md bg-muted/20" />
          const dateObj = new Date(year, month, day)
          const key = dateObj.toDateString()
          const evts = eventosPorDia[key] || []
          const isToday = key === new Date().toDateString()
          return (
            <div
              key={i}
              className={cn(
                'min-h-[88px] rounded-md border p-1.5 text-left cursor-pointer hover:bg-accent/40 transition-colors',
                isToday ? 'border-primary bg-primary/5' : 'border-border'
              )}
            >
              <div className={cn(
                'text-[11px] font-medium mb-1 inline-flex h-5 w-5 items-center justify-center rounded-full',
                isToday ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              )}>
                {day}
              </div>
              <div className="space-y-0.5">
                {evts.slice(0, 3).map((e) => (
                  <div
                    key={e.id}
                    onClick={(ev) => {
                      ev.stopPropagation()
                      if (e.processId) onOpenProcess(e.processId)
                    }}
                    className={cn('text-[10px] px-1.5 py-0.5 rounded text-white truncate', colorForTipo(e.tipo))}
                    title={e.titulo}
                  >
                    {e.titulo}
                  </div>
                ))}
                {evts.length > 3 && (
                  <div className="text-[10px] text-muted-foreground px-1">
                    +{evts.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // === VIEW SEMANAL ===
  const renderWeek = () => {
    const start = new Date(currentDate)
    start.setDate(start.getDate() - start.getDay())
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      return d
    })
    return (
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const key = d.toDateString()
          const evts = eventosPorDia[key] || []
          const isToday = key === new Date().toDateString()
          return (
            <div key={key} className={cn('rounded-md border p-2 min-h-[200px]', isToday && 'border-primary bg-primary/5')}>
              <div className="text-center mb-2 pb-2 border-b border-border">
                <p className="text-[10px] text-muted-foreground uppercase">{WEEKDAYS[d.getDay()]}</p>
                <p className={cn('text-lg font-semibold', isToday && 'text-primary')}>{d.getDate()}</p>
              </div>
              <div className="space-y-1">
                {evts.map((e) => {
                  const Icon = iconForTipo(e.tipo)
                  return (
                    <div
                      key={e.id}
                      onClick={() => e.processId && onOpenProcess(e.processId)}
                      className={cn('rounded p-1.5 cursor-pointer text-white text-[11px]', colorForTipo(e.tipo))}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Icon className="h-3 w-3" />
                        <span className="font-medium truncate">{e.titulo}</span>
                      </div>
                      {e.cliente && <p className="opacity-90 truncate">{e.cliente}</p>}
                    </div>
                  )
                })}
                {evts.length === 0 && <p className="text-[10px] text-muted-foreground text-center py-2">Sem eventos</p>}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // === VIEW DIÁRIA ===
  const renderDay = () => {
    const key = currentDate.toDateString()
    const evts = eventosPorDia[key] || []
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalIcon className="h-4 w-4 text-primary" />
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {evts.length === 0 ? (
              <div className="py-12 text-center">
                <CalIcon className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nenhum evento para este dia.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {evts.map((e) => {
                  const Icon = iconForTipo(e.tipo)
                  return (
                    <li
                      key={e.id}
                      onClick={() => e.processId && onOpenProcess(e.processId)}
                      className="rounded-md border border-border p-3 cursor-pointer hover:bg-accent/40 transition-colors flex items-start gap-3"
                    >
                      <div className={cn('h-9 w-9 rounded-md text-white flex items-center justify-center shrink-0', colorForTipo(e.tipo))}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{e.titulo}</p>
                        {e.processo && <p className="text-[11px] text-muted-foreground truncate">{e.processo}</p>}
                        {e.cliente && <p className="text-[11px] text-muted-foreground truncate">👤 {e.cliente}</p>}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityColor(e.prioridade))}>
                            {e.prioridade}
                          </span>
                          {e.responsavel && (
                            <span className="text-[10px] text-muted-foreground">• {e.responsavel}</span>
                          )}
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-5 md:p-6 space-y-4">
      {/* Header com controles */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={today}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <div className="ml-2">
            <h2 className="text-base font-semibold">
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            {mode === 'day' && (
              <p className="text-[11px] text-muted-foreground">
                {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            )}
            {mode === 'week' && (
              <p className="text-[11px] text-muted-foreground">Semana selecionada</p>
            )}
          </div>
        </div>

        <div className="flex gap-1 rounded-md border border-border p-0.5 bg-muted/30">
          {(['month', 'week', 'day'] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors',
                mode === m ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {m === 'month' ? 'Mês' : m === 'week' ? 'Semana' : 'Dia'}
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Audiências
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Prazos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-purple-500" /> Tarefas
        </span>
      </div>

      {/* View */}
      {loading ? (
        <div className="h-96 rounded-md bg-muted/40 animate-pulse" />
      ) : (
        <>
          {mode === 'month' && renderMonth()}
          {mode === 'week' && renderWeek()}
          {mode === 'day' && renderDay()}
        </>
      )}

      {/* Próximos eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Próximos eventos</CardTitle>
        </CardHeader>
        <CardContent>
          {eventos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem eventos no período.</p>
          ) : (
            <ul className="space-y-2">
              {eventos.slice(0, 5).map((e) => {
                const Icon = iconForTipo(e.tipo)
                return (
                  <li
                    key={e.id}
                    onClick={() => e.processId && onOpenProcess(e.processId)}
                    className="flex items-center gap-3 p-2 rounded hover:bg-accent/40 cursor-pointer"
                  >
                    <div className={cn('h-8 w-8 rounded-md text-white flex items-center justify-center shrink-0', colorForTipo(e.tipo))}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.titulo}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(e.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        {e.cliente && ` • ${e.cliente}`}
                      </p>
                    </div>
                    <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityColor(e.prioridade))}>
                      {e.prioridade}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
