'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus, Dumbbell, Calendar, Target } from 'lucide-react'

interface MuscleGroupProgressData {
  muscleGroupId: string
  muscleGroupName: string
  avgWeightChange: number // % de mudança na carga média
  maxWeightChange: number // % de mudança na carga máxima
  weeklyFrequency: number // treinos por semana (média)
  totalWorkouts: number
  exerciseCount: number
  lastWorkoutDate: string | null
  currentAvgWeight: number
  currentMaxWeight: number
}

interface MuscleGroupProgressProps {
  data: MuscleGroupProgressData[]
  loading?: boolean
}

export function MuscleGroupProgress({ data, loading }: MuscleGroupProgressProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-6 bg-muted rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            Nenhum dado de progresso disponível ainda. Comece registrando seus treinos!
          </p>
        </CardContent>
      </Card>
    )
  }

  const getTrendIcon = (change: number) => {
    if (change > 5) return <TrendingUp className="h-4 w-4 text-green-500" />
    if (change < -5) return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  const getTrendColor = (change: number) => {
    if (change > 5) return 'text-green-600 dark:text-green-400'
    if (change < -5) return 'text-red-600 dark:text-red-400'
    return 'text-muted-foreground'
  }

  const getFrequencyStatus = (frequency: number) => {
    if (frequency >= 1) return { color: 'text-green-600 dark:text-green-400', text: 'Ótimo!' }
    if (frequency >= 0.5) return { color: 'text-yellow-600 dark:text-yellow-400', text: 'Regular' }
    return { color: 'text-red-600 dark:text-red-400', text: 'Baixo' }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data.map((muscle) => {
        const frequencyStatus = getFrequencyStatus(muscle.weeklyFrequency)
        return (
          <Card key={muscle.muscleGroupId} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{muscle.muscleGroupName}</CardTitle>
                <div className="flex items-center gap-1">
                  {getTrendIcon(muscle.avgWeightChange)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Progresso de Carga */}
              <div>
                <div className="text-sm text-muted-foreground mb-2">Progresso de Carga</div>
                <div className="flex items-center gap-2">
                  <div className={`text-3xl font-bold ${getTrendColor(muscle.avgWeightChange)}`}>
                    {muscle.avgWeightChange > 0 ? '+' : ''}{muscle.avgWeightChange.toFixed(1)}%
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  vs 30 dias anteriores
                </div>
              </div>

              {/* Frequência Semanal */}
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Frequência (últimos 30 dias)</span>
                  <span className={`text-xs font-medium ${frequencyStatus.color}`}>
                    {frequencyStatus.text}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold">
                    {muscle.weeklyFrequency.toFixed(1)}x / semana
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {muscle.weeklyFrequency >= 1 ? '✓ Meta atingida' : 'Meta: pelo menos 1x/semana'}
                  </div>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Treinos</span>
                  </div>
                  <div className="text-lg font-semibold">{muscle.totalWorkouts}</div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Target className="h-3.5 w-3.5" />
                    <span>Exercícios</span>
                  </div>
                  <div className="text-lg font-semibold">{muscle.exerciseCount}</div>
                </div>
              </div>

              {/* Último Treino */}
              {muscle.lastWorkoutDate && (
                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-1">Último Treino</div>
                  <div className="text-sm font-medium">
                    {new Date(muscle.lastWorkoutDate).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
