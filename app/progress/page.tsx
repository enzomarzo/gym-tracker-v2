'use client'

import { useState, useEffect } from 'react'
import { redirect } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { ProgressChart } from '@/components/ProgressChart'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useExercises } from '@/hooks/useExercises'
import { createClient } from '@/utils/supabase/client'
import { getProgressData } from '@/utils/calculatePR'

export default function ProgressPage() {
  const { exercises, loading } = useExercises()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [progressData, setProgressData] = useState<{ date: string; max_weight: number }[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const selectedExerciseName = exercises.find(ex => ex.id === selectedExercise)?.name || ''

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
      </main>
    </div>
  )
}
