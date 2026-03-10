'use client'

import { Navbar } from '@/components/Navbar'
import { ProgressChart } from '@/components/ProgressChart'
import { MuscleGroupProgress } from '@/components/MuscleGroupProgress'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { useExercises } from '@/hooks/useExercises'
import { useProgressPage } from '@/hooks/useProgressPage'
import { BarChart3, TrendingUp } from 'lucide-react'

export default function ProgressPage() {
  const { exercises, loading } = useExercises()
  const {
    selectedExercise,
    setSelectedExercise,
    progressData,
    loadingData,
    viewMode,
    setViewMode,
    muscleGroupData,
    loadingMuscleData
  } = useProgressPage()

  const selectedExerciseName = exercises.find(ex => ex.id === selectedExercise)?.name || ''

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
