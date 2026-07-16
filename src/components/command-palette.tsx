'use client'

import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Search, FileText, AlarmClock, CheckSquare, DollarSign, FolderOpen, Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ViewName } from '@/app/page'

interface Result {
  tipo: string
  id: string
  titulo: string
  subtitulo: string
  info: string
}

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  onOpenProcess: (id: string) => void
  onNavigate: (v: ViewName) => void
}

const iconFor = (tipo: string) => {
  switch (tipo) {
    case 'Cliente':
      return Users
    case 'Processo':
      return FolderOpen
    case 'Tarefa':
      return CheckSquare
    case 'Prazo':
      return AlarmClock
    case 'Receita':
    case 'Despesa':
      return DollarSign
    case 'Documento':
      return FileText
    default:
      return FileText
  }
}

export function CommandPalette({ open, onOpenChange, onOpenProcess, onNavigate }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!open) {
      setQ('')
      setResults([])
      setActive(0)
    }
  }, [open])

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setResults(data.results || [])
        setActive(0)
      } finally {
        setLoading(false)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [q])

  const handleSelect = (r: Result) => {
    if (r.tipo === 'Processo') {
      onOpenProcess(r.id)
    } else if (r.tipo === 'Cliente') {
      onNavigate('clients')
    } else if (r.tipo === 'Tarefa') {
      onNavigate('tasks')
    } else if (r.tipo === 'Prazo') {
      onNavigate('deadlines')
    } else if (r.tipo === 'Receita' || r.tipo === 'Despesa') {
      onNavigate('financial')
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 gap-0 max-w-2xl overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Busca global</DialogTitle>
          <DialogDescription>Pesquise em clientes, processos, tarefas, prazos e mais.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 border-b border-border px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nome, CPF/CNPJ, processo, CNJ, documento..."
            className="h-12 border-0 focus-visible:ring-0 text-[15px]"
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                setActive((a) => Math.min(a + 1, results.length - 1))
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setActive((a) => Math.max(a - 1, 0))
              } else if (e.key === 'Enter' && results[active]) {
                handleSelect(results[active])
              }
            }}
          />
        </div>
        <div className="max-h-[420px] overflow-y-auto">
          {!q && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Comece a digitar para buscar em <strong>todo o sistema</strong>.
              <br />
              Clientes, processos, tarefas, prazos, documentos e financeiro.
            </div>
          )}
          {q && q.length < 2 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres...
            </div>
          )}
          {loading && <div className="p-6 text-center text-sm text-muted-foreground">Buscando...</div>}
          {!loading && results.length === 0 && q.length >= 2 && (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum resultado para &quot;{q}&quot;.
            </div>
          )}
          {results.length > 0 && (
            <ul className="py-2">
              {results.map((r, i) => {
                const Icon = iconFor(r.tipo)
                return (
                  <li key={`${r.tipo}-${r.id}`}>
                    <button
                      onClick={() => handleSelect(r)}
                      onMouseEnter={() => setActive(i)}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors',
                        i === active ? 'bg-accent' : 'hover:bg-accent/50'
                      )}
                    >
                      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{r.titulo}</div>
                        <div className="text-[11px] text-muted-foreground truncate">
                          {[r.tipo, r.subtitulo, r.info].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {r.tipo}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
