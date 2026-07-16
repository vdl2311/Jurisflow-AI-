'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Bell, CheckCheck, AlarmClock, DollarSign, CheckSquare, Info, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { priorityColor, formatDateTime } from '@/lib/format'

interface Notification {
  id: string
  type: string
  title: string
  description: string | null
  link: string | null
  read: boolean
  priority: string
  createdAt: string
}

const iconFor = (type: string) => {
  switch (type) {
    case 'prazo': return AlarmClock
    case 'honorario': return DollarSign
    case 'tarefa': return CheckSquare
    case 'audiencia': return AlertTriangle
    default: return Info
  }
}

const colorFor = (type: string) => {
  switch (type) {
    case 'prazo': return 'text-amber-600 bg-amber-50 dark:bg-amber-950/30'
    case 'honorario': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
    case 'tarefa': return 'text-purple-600 bg-purple-50 dark:bg-purple-950/30'
    case 'audiencia': return 'text-red-600 bg-red-50 dark:bg-red-950/30'
    default: return 'text-blue-600 bg-blue-50 dark:bg-blue-950/30'
  }
}

export function NotificationsView() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'todas' | 'naolidas'>('todas')

  const load = () => {
    setLoading(true)
    fetch('/api/notifications')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' })
    load()
  }

  const markAllRead = async () => {
    await fetch('/api/notifications?all=true', { method: 'PATCH' })
    load()
  }

  const filtered = filter === 'naolidas' ? items.filter((i) => !i.read) : items
  const naoLidas = items.filter((i) => !i.read).length

  return (
    <div className="p-5 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-md border border-border p-0.5 bg-muted/30">
          <button
            onClick={() => setFilter('todas')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              filter === 'todas' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Todas ({items.length})
          </button>
          <button
            onClick={() => setFilter('naolidas')}
            className={cn(
              'px-3 py-1 text-xs font-medium rounded transition-colors',
              filter === 'naolidas' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
            )}
          >
            Não lidas ({naoLidas})
          </button>
        </div>
        {naoLidas > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1.5" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {filter === 'naolidas' ? 'Nenhuma notificação não lida.' : 'Nenhuma notificação.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => {
            const Icon = iconFor(n.type)
            return (
              <Card key={n.id} className={cn(!n.read && 'border-l-4 border-l-primary')}>
                <CardContent className="p-3.5 flex items-start gap-3">
                  <div className={cn('h-9 w-9 rounded-md flex items-center justify-center shrink-0', colorFor(n.type))}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('text-sm', n.read ? 'font-normal' : 'font-semibold')}>{n.title}</p>
                      <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-medium', priorityColor(n.priority))}>
                        {n.priority}
                      </span>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    {n.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{n.description}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)}>
                      <CheckCheck className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </ul>
      )}
    </div>
  )
}
