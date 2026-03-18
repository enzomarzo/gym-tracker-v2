'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Sparkles, RotateCcw, CheckCircle } from 'lucide-react'
import { getLastAnalysis, deleteTodayAnalysis } from '@/queries/aiCoach'

export default function SettingsPage() {
  const [analysisDate, setAnalysisDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reset, setReset] = useState(false)

  useEffect(() => {
    getLastAnalysis().then(a => {
      setAnalysisDate(a ? a.created_at : null)
    }).finally(() => setLoading(false))
  }, [])

  const handleReset = async () => {
    await deleteTodayAnalysis()
    setAnalysisDate(null)
    setReset(true)
    setTimeout(() => setReset(false), 3000)
  }

  const isUsedToday = !!analysisDate

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Ferramentas de administração</p>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <div>
              <CardTitle className="text-base">Personal Trainer IA</CardTitle>
              <CardDescription>Limite de 1 análise por dia</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border px-4 py-3 text-sm">
              <span className="text-muted-foreground">Última análise gerada</span>
              <span className="font-medium">
                {loading
                  ? 'Carregando...'
                  : analysisDate
                  ? new Date(analysisDate).toLocaleString('pt-BR')
                  : 'Nenhuma ainda'}
              </span>
            </div>

            {isUsedToday && (
              <div className="text-sm text-muted-foreground bg-secondary rounded-md px-4 py-3">
                O botão está bloqueado hoje. Reinicie para liberar novamente.
              </div>
            )}

            {reset ? (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                Botão liberado com sucesso!
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleReset}
                disabled={!isUsedToday || loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reiniciar limite diário
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
