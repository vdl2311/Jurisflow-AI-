'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { AlarmClock, CheckSquare, ChevronRight } from 'lucide-react'
import { priorityColor, formatDate, relativeDate, daysUntil, statusColor } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Deadline {
  id: string
  title: string
  dueDate: string
  type: string
  priority: string
  responsible: string | null
  done: boolean
  notes: string | null
  process: { id: string; title: string; client: { name: string } } | null
}

interface Props {
  onOpenProcess: (id: string) => void
}

export function DeadlinesView({ onOpenProcess }: Props) {
  const [items, setItems] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState('7dias')
  const { toast } = useToast()

  const load = () => {
    setLoading(true)
    fetch(`/api/deadlines?periodo=${periodo}&done=false`)
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [periodo])

  const toggleDone = async (d: Deadline) => {
    await fetch(`/api/deadlines?id=${d.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: !d.done }),
    })
    toast({
      title: d.done ? 'Prazo reaberto' : 'Prazo concluído',
      description: d.title,
    })
    load()
  }

  const grouped: Record<string, Deadline[]> = {}
  for (const d of items) {
    const key = formatDate(d.dueDate)
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(d)
  }
  const dates = Object.keys(grouped).sort((a, b) => {
    const da = new Date(a.split('/').reverse().join('-')).getTime()
    const db = new Date(b.split('/').reverse().join('-')).getTime()
    return da - db
  })

  return (
    <div className="p-5 md:p-6 space-y-4">
      <Tabs value={periodo} onValueChange={setPeriodo}>
        <TabsList>
          <TabsTrigger value="hoje">Hoje</TabsTrigger>
          <TabsTrigger value="7dias">7 dias</TabsTrigger>
          <TabsTrigger value="30dias">30 dias</TabsTrigger>
          <TabsTrigger value="atrasados">Atrasados</TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <AlarmClock className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {periodo === 'atrasados' ? 'Nenhum prazo atrasado. Bom trabalho!' : 'Nenhum prazo neste período.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {dates.map((date) => (
            <div key={date} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold">{date}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {grouped[date].length} {grouped[date].length === 1 ? 'prazo' : 'prazos'}
                </Badge>
              </div>
              <ul className="space-y-2">
                {grouped[date].map((d) => {
                  const dias = daysUntil(d.dueDate)
                  const atrasado = dias < 0 && !d.done
                  return (
                    <Card
                      key={d.id}
                      className={cn(atrasado && 'border-red-300 dark:border-red-900/50')}
                    >
                      <CardContent className="p-3.5 flex items-start gap-3">
                        <button
                          onClick={() => toggleDone(d)}
                          className={cn(
                            'mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                            d.done ? 'bg-emerald-500 border-emerald-500' : 'border-input hover:border-primary'
                          )}
                        >
                          {d.done && <CheckSquare className="h-3.5 w-3.5 text-white" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', d.done && 'line-through text-muted-foreground')}>
                            {d.title}
                          </p>
                          {d.process && (
                            <button
                              onClick={() => onOpenProcess(d.process!.id)}
                              className="text-[11px] text-muted-foreground hover:text-primary truncate block mt-0.5"
                            >
                              {d.process.title} • {d.process.client.name}
                            </button>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityColor(d.priority))}>
                              {d.priority}
                            </span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium',
                              d.type === 'Fatal' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900' : 'border-border text-muted-foreground'
                            )}>
                              {d.type}
                            </span>
                            {d.responsible && (
                              <span className="text-[10px] text-muted-foreground">• {d.responsible}</span>
                            )}
                            <span className={cn(
                              'text-[10px] font-medium',
                              atrasado ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                            )}>
                              • {relativeDate(d.dueDate)}
                            </span>
                          </div>
                          {d.notes && <p className="text-[11px] text-muted-foreground mt-1">{d.notes}</p>}
                        </div>

                        {d.process && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onOpenProcess(d.process!.id)}
                            className="shrink-0"
                          >
                            Abrir
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
