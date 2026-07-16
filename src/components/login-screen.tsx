'use client'

import { useState } from 'react'
import { Scale, Lock, Mail, Shield, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

interface LoginProps {
  onLogin: (user: { id: string; name: string; email: string; role: string }) => void
}

export function LoginScreen({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('demo123')
  const [twoFactorCode, setTwoFactorCode] = useState('')
  const [requires2FA, setRequires2FA] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, twoFactorCode }),
      })
      const data = await res.json()

      if (data.requires2FA) {
        setRequires2FA(true)
        setError('')
      } else if (data.error) {
        setError(data.error)
      } else {
        onLogin(data.user)
      }
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Painel esquerdo - branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 bg-gradient-to-br from-primary/10 via-primary/5 to-background border-r border-border">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <p className="font-semibold text-lg">JusFlow</p>
            <p className="text-xs text-muted-foreground">Plataforma Jurídica Inteligente</p>
          </div>
        </div>

        <div className="space-y-6 max-w-md">
          <h1 className="text-3xl font-bold leading-tight">
            A advocacia do futuro,<br />no seu escritório hoje.
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sistema jurídico completo com IA, gestão de processos, prazos automáticos,
            Copiloto Jurídico e portal do cliente. Tudo em um só lugar.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-4">
            {[
              { t: 'Copiloto IA', d: 'Gere petições em segundos' },
              { t: 'Prazos', d: 'Alertas automáticos' },
              { t: 'Multitenancy', d: 'SaaS multi-escritório' },
              { t: 'LGPD', d: 'Criptografia ponta a ponta' },
            ].map((f) => (
              <div key={f.t} className="rounded-lg border border-border bg-card p-3">
                <p className="text-sm font-medium">{f.t}</p>
                <p className="text-[11px] text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground">
          © 2026 JusFlow • Conformidade LGPD • Backup automático
        </p>
      </div>

      {/* Painel direito - formulário */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8 flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center">
              <Scale className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">JusFlow</span>
          </div>

          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-bold">Entrar</h2>
            <p className="text-sm text-muted-foreground">
              Acesse sua conta para continuar.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {requires2FA && (
              <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
                <Label htmlFor="2fa" className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Código 2FA
                </Label>
                <Input
                  id="2fa"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center tracking-[0.3em] font-mono"
                />
                <p className="text-[11px] text-muted-foreground">
                  💡 Demo: use <code className="bg-muted px-1 rounded">123456</code>
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 text-destructive text-sm p-2.5 border border-destructive/20">
                {error}
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-md bg-muted/50 border border-border">
            <p className="text-[11px] text-muted-foreground font-medium mb-1.5">
              🔑 Contas demo (senha: <code>demo123</code>):
            </p>
            <div className="space-y-0.5 text-[11px] text-muted-foreground">
              <p><strong>admin@jusflow.com</strong> — Administrador (acesso total)</p>
              <p><strong>patricia@jusflow.com</strong> — Sócia (com 2FA: 123456)</p>
              <p><strong>roberto@jusflow.com</strong> — Advogado</p>
              <p><strong>ana@jusflow.com</strong> — Secretária</p>
              <p><strong>pedro@jusflow.com</strong> — Estagiário</p>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-center text-muted-foreground">
            Esqueceu sua senha? <a className="text-primary hover:underline cursor-pointer">Recuperar acesso</a>
          </p>
        </div>
      </div>
    </div>
  )
}
