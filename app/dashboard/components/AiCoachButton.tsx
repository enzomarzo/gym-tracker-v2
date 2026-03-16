'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react'
import { getTodayAnalysis } from '@/queries/aiCoach'

type ParsedSection = {
  title: string
  items: string[]
  numbered: boolean
}

function parseIntoSections(text: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  let current: ParsedSection | null = null

  for (const raw of text.split('\n')) {
    const line = raw.trim()
    if (!line) continue

    if (/^\*\*(.+)\*\*$/.test(line)) {
      if (current) sections.push(current)
      const title = line.replace(/^\*\*(.+)\*\*$/, '$1')
      current = { title, items: [], numbered: false }
      continue
    }
    if (!current) continue

    if (/^- /.test(line)) {
      current.items.push(line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
      continue
    }
    if (/^\d+\. /.test(line)) {
      current.numbered = true
      current.items.push(line.replace(/^\d+\. /, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
      continue
    }
    current.items.push(line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'))
  }
  if (current) sections.push(current)
  return sections
}

const SECTION_STYLES = [
  {
    border: 'border-emerald-200 dark:border-emerald-800',
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    titleColor: 'text-emerald-800 dark:text-emerald-300',
    dotColor: 'text-emerald-500',
    numColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    border: 'border-amber-200 dark:border-amber-800',
    bg: 'bg-amber-50/70 dark:bg-amber-950/30',
    titleColor: 'text-amber-800 dark:text-amber-300',
    dotColor: 'text-amber-500',
    numColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    border: 'border-blue-200 dark:border-blue-800',
    bg: 'bg-blue-50/70 dark:bg-blue-950/30',
    titleColor: 'text-blue-800 dark:text-blue-300',
    dotColor: 'text-blue-500',
    numColor: 'text-blue-600 dark:text-blue-400',
  },
]

function AnalysisResult({ result }: { result: string }) {
  const sections = parseIntoSections(result)

  return (
    <div className="flex flex-col gap-3">
      {sections.map((section, i) => {
        const style = SECTION_STYLES[i % SECTION_STYLES.length]
        return (
          <div key={i} className={`rounded-lg border p-3 ${style.border} ${style.bg}`}>
            <p className={`font-semibold text-sm mb-2 ${style.titleColor}`}>{section.title}</p>
            <ul className="space-y-1.5">
              {section.items.map((item, j) => (
                <li key={j} className="flex gap-2 text-xs leading-snug text-foreground/80">
                  {section.numbered
                    ? <span className={`shrink-0 font-bold w-4 mt-px ${style.numColor}`}>{j + 1}.</span>
                    : <span className={`shrink-0 mt-px ${style.dotColor}`}>•</span>
                  }
                  <span
                    dangerouslySetInnerHTML={{ __html: item }}
                    className="[&_strong]:font-semibold [&_strong]:text-foreground"
                  />
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function AiCoachButton() {
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [blocked, setBlocked] = useState(false)

  // Ao carregar, verificar se já existe análise de hoje no banco
  useEffect(() => {
    getTodayAnalysis()
      .then(analysis => {
        if (analysis) {
          setResult(analysis.content)
          setBlocked(true)
          setOpen(true)
        }
      })
      .finally(() => setInitializing(false))
  }, [])

  const handleClick = async () => {
    if (blocked) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai-coach', { method: 'POST' })
      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error ?? 'Erro inesperado')
        return
      }

      setResult(data.result)
      setOpen(true)
      setBlocked(true)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6">
      <Card className="border-purple-200 dark:border-purple-900 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-semibold">Personal Trainer IA</CardTitle>
          </div>
          {result && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(o => !o)}
              className="h-7 px-2 text-purple-600"
            >
              {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {open ? 'Ocultar' : 'Ver análise'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          {!result && !initializing && (
            <p className="text-sm text-muted-foreground">
              Receba uma análise dos seus últimos 30 dias de treino: o que está indo bem e o que pode melhorar.
            </p>
          )}

          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md p-3">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && open && (
            <AnalysisResult result={result} />
          )}

          {initializing ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Carregando...
            </div>
          ) : blocked ? (
            <p className="text-xs text-muted-foreground">
              ✓ Análise gerada hoje. Volte amanhã para uma nova.
            </p>
          ) : (
            <Button
              onClick={handleClick}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analisando treinos...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Avaliar meu progresso
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
