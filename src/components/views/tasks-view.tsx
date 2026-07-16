'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core'
import { Plus, CheckSquare, Calendar, User, GripVertical } from 'lucide-react'
import { priorityColor, formatDate, relativeDate } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  assignee: string | null
  processId: string | null
  clientId: string | null
  process: { id: string; title: string } | null
  client: { id: string; name: string } | null
}

interface Props {
  onOpenProcess: (id: string) => void
}

const COLS = [
  { id: 'A Fazer', label: 'A Fazer', color: 'border-t-slate-400' },
  { id: 'Em Andamento', label: 'Em Andamento', color: 'border-t-amber-500' },
  { id: 'Em Revisão', label: 'Em Revisão', color: 'border-t-purple-500' },
  { id: 'Concluída', label: 'Concluída', color: 'border-t-emerald-500' },
]

export function TasksView({ onOpenProcess }: Props) {
  const [items, setItems] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [processes, setProcesses] = useState<{ id: string; title: string }[]>([])
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const { toast } = useToast()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const load = () => {
    setLoading(true)
    fetch('/api/tasks')
      .then((r) => r.json())
      .then(setItems)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    fetch('/api/processes').then((r) => r.json()).then(setProcesses)
    fetch('/api/clients').then((r) => r.json()).then(setClients)
  }, [])

  const onDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over) return
    const newStatus = String(over.id)
    const task = items.find((t) => t.id === active.id)
    if (!task || task.status === newStatus) return

    // otimista
    setItems((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)))

    await fetch(`/api/tasks?id=${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    toast({ title: 'Tarefa movida', description: `${task.title} → ${newStatus}` })
  }

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      toast({ title: 'Tarefa criada' })
      setModalOpen(false)
      load()
    }
  }

  return (
    <div className="p-5 md:p-6 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.filter((t) => t.status !== 'Concluída').length} tarefas ativas • Arraste entre colunas
        </p>
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nova tarefa
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-64 rounded-md bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 min-h-0">
            {COLS.map((col) => {
              const colItems = items.filter((t) => t.status === col.id)
              return (
                <Column key={col.id} col={col} tasks={colItems} onOpenProcess={onOpenProcess} />
              )
            })}
          </div>
        </DndContext>
      )}

      <NewTaskModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        processes={processes}
        clients={clients}
        onSubmit={handleCreate}
      />
    </div>
  )
}

function Column({
  col,
  tasks,
  onOpenProcess,
}: {
  col: { id: string; label: string; color: string }
  tasks: Task[]
  onOpenProcess: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-md border border-border border-t-4 bg-muted/30 flex flex-col min-h-[200px]',
        col.color,
        isOver && 'bg-primary/5 border-primary/40'
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold">{col.label}</h3>
        <span className="text-[11px] text-muted-foreground bg-background px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onOpenProcess={onOpenProcess} />
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-6 text-xs text-muted-foreground">
            Arraste tarefas para esta coluna
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({ task, onOpenProcess }: { task: Task; onOpenProcess: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  })
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'rounded-md bg-card border border-border p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow',
        isDragging && 'shadow-lg opacity-50'
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium leading-tight">{task.title}</p>
          {task.description && (
            <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            <span className={cn('text-[9px] px-1 py-0.5 rounded border font-medium', priorityColor(task.priority))}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                <Calendar className="h-2.5 w-2.5" />
                {relativeDate(task.dueDate)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-border">
            {task.assignee && (
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 truncate">
                <User className="h-2.5 w-2.5" />
                {task.assignee}
              </span>
            )}
            {task.process && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenProcess(task.process!.id)
                }}
                className="text-[10px] text-primary hover:underline truncate ml-auto"
              >
                Abrir processo
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function NewTaskModal({
  open,
  onOpenChange,
  processes,
  clients,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  processes: { id: string; title: string }[]
  clients: { id: string; name: string }[]
  onSubmit: (data: Record<string, unknown>) => void
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    status: 'A Fazer',
    priority: 'Média',
    dueDate: '',
    assignee: '',
    processId: '',
    clientId: '',
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
          <DialogDescription>Crie uma tarefa para você ou para a equipe.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="t-title">Título *</Label>
            <Input id="t-title" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-desc">Descrição</Label>
            <Textarea id="t-desc" value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="t-priority">Prioridade</Label>
              <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Baixa', 'Média', 'Alta', 'Crítica'].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-due">Prazo</Label>
              <Input id="t-due" type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-ass">Responsável</Label>
              <Select value={form.assignee} onValueChange={(v) => set('assignee', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {['Dra. Patrícia Almeida', 'Dr. Roberto Lima', 'Estagiário Pedro', 'Secretária Ana'].map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="t-status">Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLS.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="t-proc">Vincular a processo (opcional)</Label>
            <Select value={form.processId} onValueChange={(v) => set('processId', v)}>
              <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
              <SelectContent>
                {processes.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            disabled={!form.title}
            onClick={() => {
              onSubmit({
                ...form,
                processId: form.processId || null,
                clientId: form.clientId || null,
                dueDate: form.dueDate || null,
              })
              setForm({ title: '', description: '', status: 'A Fazer', priority: 'Média', dueDate: '', assignee: '', processId: '', clientId: '' })
            }}
          >
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
