'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sparkles, RotateCcw, CheckCircle, Target, Save } from 'lucide-react'
import { getLastAnalysis, deleteTodayAnalysis } from '@/queries/aiCoach'
import { getUserProfile, saveUserProfile, GOAL_OPTIONS, type TrainingGoal } from '@/queries/userProfile'

const NO_SECONDARY = '__none__'

export default function SettingsPage() {
  const [analysisDate, setAnalysisDate] = useState<string | null>(null)
  const [loadingAnalysis, setLoadingAnalysis] = useState(true)
  const [reset, setReset] = useState(false)

  const [goal1, setGoal1] = useState<TrainingGoal>('hypertrophy')
  const [goal2, setGoal2] = useState<TrainingGoal | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = useState(false)

  useEffect(() => {
    getLastAnalysis().then(a => {
      setAnalysisDate(a ? a.created_at : null)
    }).finally(() => setLoadingAnalysis(false))

    getUserProfile().then(p => {
      if (p) {
        setGoal1(p.goal_1 as TrainingGoal)
        setGoal2(p.goal_2 as TrainingGoal | null)
      }
    }).finally(() => setLoadingProfile(false))
  }, [])

  const handleReset = async () => {
    await deleteTodayAnalysis()
    setAnalysisDate(null)
    setReset(true)
    setTimeout(() => setReset(false), 3000)
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await saveUserProfile({ goal_1: goal1, goal_2: goal2 })
      setSavedProfile(true)
      setTimeout(() => setSavedProfile(false), 3000)
    } finally {
      setSavingProfile(false)
    }
  }

  const isUsedToday = !!analysisDate
  const secondaryOptions = GOAL_OPTIONS.filter(o => o.value !== goal1)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Configurações</h1>
          <p className="text-muted-foreground">Personalize sua experiência</p>
        </div>

        {/* Objetivos de treino */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Target className="h-5 w-5 text-blue-500" />
            <div>
              <CardTitle className="text-base">Objetivos de treino</CardTitle>
              <CardDescription>O Personal Trainer IA usará esses objetivos para personalizar as recomendações</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingProfile ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Objetivo principal</label>
                  <Select value={goal1} onValueChange={(v) => {
                    setGoal1(v as TrainingGoal)
                    if (goal2 === v) setGoal2(null)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GOAL_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="font-medium">{o.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{o.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Objetivo secundário{' '}
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <Select
                    value={goal2 ?? NO_SECONDARY}
                    onValueChange={(v) => setGoal2(v === NO_SECONDARY ? null : v as TrainingGoal)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_SECONDARY}>Nenhum</SelectItem>
                      {secondaryOptions.map(o => (
                        <SelectItem key={o.value} value={o.value}>
                          <span className="font-medium">{o.label}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{o.description}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {savedProfile ? (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Objetivos salvos com sucesso!
                  </div>
                ) : (
                  <Button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {savingProfile ? 'Salvando...' : 'Salvar objetivos'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Personal Trainer IA */}
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
                {loadingAnalysis
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
                disabled={!isUsedToday || loadingAnalysis}
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
