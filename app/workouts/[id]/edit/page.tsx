'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Copy, Trash2 } from 'lucide-react'
import { getWorkoutById, updateWorkoutSets, ExerciseGroupInput } from '@/queries/workouts'

interface Set {
  id: string
  weight: string
  reps: string
  dbId: string // ID do banco de dados
}

interface ExerciseGroup {
  exerciseId: string
  exerciseName: string
  muscleGroupName: string
  sets: Set[]
}

export default function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup[]>([])
  const [workoutDate, setWorkoutDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (workoutId) {
      fetchWorkout()
    }
  }, [workoutId])

  const fetchWorkout = async () => {
    try {
      const data = await getWorkoutById(workoutId)

      if (!data) {
        setError('Treino não encontrado')
        return
      }

      setWorkoutDate(data.date)

      // Agrupar séries por exercício
      const groupedByExercise = data.workout_sets.reduce((acc: any, set: any) => {
        const exerciseId = set.exercise_id
        if (!acc[exerciseId]) {
          acc[exerciseId] = {
            exerciseId,
            exerciseName: set.exercises.name,
            muscleGroupName: set.exercises.muscle_groups.name,
            sets: []
          }
        }
        acc[exerciseId].sets.push({
          id: acc[exerciseId].sets.length.toString(),
          dbId: set.id,
          weight: set.weight.toString(),
          reps: set.reps.toString()
        })
        return acc
      }, {})

      setExerciseGroups(Object.values(groupedByExercise))
    } catch (err) {
      console.error('Erro ao carregar treino:', err)
      setError('Erro ao carregar treino')
    } finally {
      setIsLoading(false)
    }
  }

  const addSet = (exerciseIndex: number) => {
    const newGroups = [...exerciseGroups]
    const newSetId = newGroups[exerciseIndex].sets.length.toString()
    newGroups[exerciseIndex].sets.push({
      id: newSetId,
      dbId: '',
      weight: '',
      reps: ''
    })
    setExerciseGroups(newGroups)
  }

  const replicateLastSet = (exerciseIndex: number) => {
    const sets = exerciseGroups[exerciseIndex].sets
    if (sets.length === 0) return
    const lastSet = sets[sets.length - 1]
    const newSetId = sets.length.toString()
    const newGroups = [...exerciseGroups]
    newGroups[exerciseIndex].sets.push({
      id: newSetId,
      dbId: '',
      weight: lastSet.weight,
      reps: lastSet.reps
    })
    setExerciseGroups(newGroups)
  }

  const removeSet = (exerciseIndex: number, setId: string) => {
    const newGroups = [...exerciseGroups]
    if (newGroups[exerciseIndex].sets.length === 1) return
    newGroups[exerciseIndex].sets = newGroups[exerciseIndex].sets.filter(set => set.id !== setId)
    // Reindexar IDs
    newGroups[exerciseIndex].sets.forEach((set, idx) => {
      set.id = idx.toString()
    })
    setExerciseGroups(newGroups)
  }

  const updateSet = (exerciseIndex: number, setId: string, field: 'weight' | 'reps', value: string) => {
    const newGroups = [...exerciseGroups]
    const setIndex = newGroups[exerciseIndex].sets.findIndex(s => s.id === setId)
    if (setIndex !== -1) {
      newGroups[exerciseIndex].sets[setIndex][field] = value
    }
    setExerciseGroups(newGroups)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validar que todos os campos estão preenchidos
    for (const group of exerciseGroups) {
      if (group.sets.some(set => !set.weight || !set.reps)) {
        setError(`Preencha peso e repetições de todas as séries de ${group.exerciseName}`)
        return
      }
    }

    try {
      setIsSubmitting(true)
      await updateWorkoutSets(workoutId, exerciseGroups as ExerciseGroupInput[])
      router.push('/workouts')
    } catch (err) {
      console.error('Erro ao atualizar treino:', err)
      setError('Erro ao atualizar treino. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando treino...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Editar Treino</h1>
            {workoutDate && (
              <p className="text-muted-foreground">
                {new Date(workoutDate + 'T00:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            onClick={() => router.push('/workouts')}
            type="button"
          >
            Voltar
          </Button>
        </div>

        {error && exerciseGroups.length === 0 ? (
          <div className="bg-red-100 p-4 rounded-md text-red-700">
            {error}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {exerciseGroups.map((group, groupIndex) => (
              <Card key={groupIndex}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{group.exerciseName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {group.muscleGroupName}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => replicateLastSet(groupIndex)}
                        disabled={group.sets.length === 0}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Replicar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addSet(groupIndex)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Série
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {group.sets.map((set, index) => (
                    <div key={set.id} className="flex items-end gap-3">
                      <div className="flex-none w-16">
                        {index === 0 && <Label className="text-xs">Série</Label>}
                        <div className="h-10 flex items-center justify-center border rounded-md bg-muted">
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        {index === 0 && (
                          <Label htmlFor={`weight-${groupIndex}-${set.id}`} className="text-xs">
                            Peso (kg)
                          </Label>
                        )}
                        <Input
                          id={`weight-${groupIndex}-${set.id}`}
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => updateSet(groupIndex, set.id, 'weight', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="flex-1">
                        {index === 0 && (
                          <Label htmlFor={`reps-${groupIndex}-${set.id}`} className="text-xs">
                            Repetições
                          </Label>
                        )}
                        <Input
                          id={`reps-${groupIndex}-${set.id}`}
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(groupIndex, set.id, 'reps', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeSet(groupIndex, set.id)}
                        disabled={group.sets.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}

            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.push('/workouts')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || exerciseGroups.length === 0}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </form>
        )}
      </main>
    </div>
  )
}
