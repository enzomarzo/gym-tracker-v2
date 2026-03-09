'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ProgressChart } from '@/components/ProgressChart'
import { MuscleGroupProgress } from '@/components/MuscleGroupProgress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useExercises } from '@/hooks/useExercises'
import { useMuscleGroups } from '@/hooks/useExercises'
import { createClient } from '@/utils/supabase/client'
import { getProgressData } from '@/utils/calculatePR'
import { BarChart3, TrendingUp } from 'lucide-react'

export default function ProgressPage() {
  const { exercises, loading } = useExercises()
  const { muscleGroups, loading: loadingGroups } = useMuscleGroups()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [progressData, setProgressData] = useState<{ date: string; max_weight: number }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [viewMode, setViewMode] = useState<'muscle' | 'exercise'>('muscle')
  const [muscleGroupData, setMuscleGroupData] = useState<any[]>([])
  const [loadingMuscleData, setLoadingMuscleData] = useState(false)

  const selectedExerciseName = exercises.find(ex => ex.id === selectedExercise)?.name || ''

  // Buscar dados de progresso por grupo muscular
  useEffect(() => {
    if (viewMode === 'muscle') {
      fetchMuscleGroupProgress()
    }
  }, [viewMode])

  const fetchMuscleGroupProgress = async () => {
    try {
      setLoadingMuscleData(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Buscar todos os workout_sets com exercícios e workouts
      const { data: workoutSets, error } = await supabase
        .from('workout_sets')
        .select(`
          weight,
          reps,
          exercise:exercises (
            id,
            name,
            muscle_group_id
          ),
          workout:workouts!inner (
            date,
            user_id
          )
        `)
        .eq('workout.user_id', user.id)
        .order('workout(date)', { ascending: false })

      if (error) throw error

      // Agrupar dados por grupo muscular
      const muscleGroupStats = muscleGroups.map(group => {
        const groupSets = workoutSets?.filter((set: any) => 
          set.exercise?.muscle_group_id === group.id
        ) || []

        if (groupSets.length === 0) {
          return null
        }

        // Contar treinos únicos (datas únicas)
        const uniqueDates = new Set(groupSets.map((set: any) => 
          new Date(set.workout.date).toDateString()
        ))
        const totalWorkouts = uniqueDates.size

        // Contar exercícios únicos
        const uniqueExercises = new Set(groupSets.map((set: any) => set.exercise.id))
        const exerciseCount = uniqueExercises.size

        // Última data de treino
        const lastWorkoutDate = groupSets.length > 0 
          ? (groupSets[0] as any).workout.date 
          : null

        // Calcular progresso de carga (últimos 30 dias vs 30 dias anteriores)
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

        const recentSets = groupSets.filter((set: any) => 
          new Date(set.workout.date) >= thirtyDaysAgo
        )
        const previousSets = groupSets.filter((set: any) => {
          const date = new Date(set.workout.date)
          return date >= sixtyDaysAgo && date < thirtyDaysAgo
        })

        // Carga média atual (últimos 30 dias)
        const currentAvgWeight = recentSets.length > 0
          ? recentSets.reduce((acc: number, set: any) => acc + set.weight, 0) / recentSets.length
          : 0

        // Carga média anterior (30-60 dias atrás)
        const previousAvgWeight = previousSets.length > 0
          ? previousSets.reduce((acc: number, set: any) => acc + set.weight, 0) / previousSets.length
          : 0

        // % de mudança na carga média
        const avgWeightChange = previousAvgWeight > 0 
          ? ((currentAvgWeight - previousAvgWeight) / previousAvgWeight) * 100 
          : 0

        // Carga máxima atual e anterior
        const currentMaxWeight = recentSets.length > 0
          ? Math.max(...recentSets.map((set: any) => set.weight))
          : 0

        const previousMaxWeight = previousSets.length > 0
          ? Math.max(...previousSets.map((set: any) => set.weight))
          : 0

        const maxWeightChange = previousMaxWeight > 0
          ? ((currentMaxWeight - previousMaxWeight) / previousMaxWeight) * 100
          : 0

        // Calcular frequência semanal (últimos 30 dias)
        const recentDates = new Set(
          recentSets.map((set: any) => new Date(set.workout.date).toDateString())
        )
        const weeklyFrequency = (recentDates.size / 30) * 7 // treinos por semana

        return {
          muscleGroupId: group.id,
          muscleGroupName: group.name,
          avgWeightChange,
          maxWeightChange,
          weeklyFrequency,
          totalWorkouts,
          exerciseCount,
          lastWorkoutDate,
          currentAvgWeight,
          currentMaxWeight
        }
      }).filter(Boolean)

      setMuscleGroupData(muscleGroupStats)
    } catch (err) {
      console.error('Erro ao buscar progresso por grupo muscular:', err)
      setMuscleGroupData([])
    } finally {
      setLoadingMuscleData(false)
    }
  }

  useEffect(() => {
    if (selectedExercise) {
      fetchProgressData(selectedExercise)
    }
  }, [selectedExercise])

  const fetchProgressData = async (exerciseId: string) => {
    try {
      setLoadingData(true)
      const supabase = createClient()

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          weight,
          workout:workouts!inner (
            date,
            user_id
          )
        `)
        .eq('exercise_id', exerciseId)
        .eq('workout.user_id', user.id)
        .order('workout(date)', { ascending: true })

      if (error) throw error

      const formattedData = data?.map((item: any) => ({
        weight: item.weight,
        workout: { date: item.workout.date }
      })) || []

      const progressData = getProgressData(formattedData)
      setProgressData(progressData)
    } catch (err) {
      console.error('Erro ao buscar dados de progresso:', err)
      setProgressData([])
    } finally {
      setLoadingData(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Progresso</h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução ao longo do tempo
          </p>
        </div>

        {/* Toggle entre visualizações */}
        <div className="mb-6 flex gap-2">
          <Button
            variant={viewMode === 'muscle' ? 'default' : 'outline'}
            onClick={() => setViewMode('muscle')}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Por Grupo Muscular
          </Button>
          <Button
            variant={viewMode === 'exercise' ? 'default' : 'outline'}
            onClick={() => setViewMode('exercise')}
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Por Exercício
          </Button>
        </div>

        {/* Visualização por Grupo Muscular */}
        {viewMode === 'muscle' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Evolução por Grupo Muscular</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Acompanhe o progresso de carga e frequência de treino por grupo muscular. 
                Comparação entre os últimos 30 dias vs 30 dias anteriores.
              </p>
              <MuscleGroupProgress data={muscleGroupData} loading={loadingMuscleData} />
            </div>
          </div>
        )}

        {/* Visualização por Exercício */}
        {viewMode === 'exercise' && (
          <div className="space-y-6">
            <div className="max-w-sm space-y-2">
              <Label>Selecione o exercício</Label>
              <Select
                value={selectedExercise}
                onValueChange={setSelectedExercise}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um exercício" />
                </SelectTrigger>
                <SelectContent>
                  {exercises.map((exercise) => (
                    <SelectItem key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedExercise && !loadingData && (
              <ProgressChart data={progressData} exerciseName={selectedExerciseName} />
            )}

            {loadingData && (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted-foreground">Carregando dados...</p>
              </div>
            )}

            {!selectedExercise && !loading && (
              <div className="flex items-center justify-center py-12 border-2 border-dashed rounded-lg">
                <p className="text-muted-foreground">
                  Selecione um exercício para ver o gráfico de evolução
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
