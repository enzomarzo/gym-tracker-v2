'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMuscleGroups, useExercises } from '@/hooks/useExercises'
import { updateWorkout } from '@/app/actions/workout'
import { Plus, Copy, Trash2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

interface Set {
  id: string
  weight: string
  reps: string
}

interface WorkoutSet {
  id: string
  weight: number
  reps: number
  set_number: number
  exercise_id: string
}

interface WorkoutData {
  id: string
  date: string
  workout_sets: WorkoutSet[]
}

export default function EditWorkoutPage() {
  const router = useRouter()
  const params = useParams()
  const workoutId = params.id as string
  const { muscleGroups, loading: loadingGroups } = useMuscleGroups()
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')
  const { exercises, loading: loadingExercises } = useExercises(selectedMuscleGroup)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [sets, setSets] = useState<Set[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (workoutId) {
      fetchWorkout()
    }
  }, [workoutId])

  useEffect(() => {
    // Quando o exercício é carregado, definir o grupo muscular
    if (selectedExercise && exercises.length > 0) {
      const exercise = exercises.find(e => e.id === selectedExercise)
      if (exercise) {
        setSelectedMuscleGroup(exercise.muscle_group_id)
      }
    }
  }, [selectedExercise, exercises])

  const fetchWorkout = async () => {
    try {
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          workout_sets (
            id,
            weight,
            reps,
            set_number,
            exercise_id,
            exercises (
              id,
              name,
              muscle_group_id
            )
          )
        `)
        .eq('id', workoutId)
        .single()

      if (error || !data) {
        console.error('Erro ao carregar treino:', error)
        setError('Treino não encontrado')
        return
      }

      if (data.workout_sets && data.workout_sets.length > 0) {
        // Pegar o primeiro exercício
        const firstSet = data.workout_sets[0]
        const exerciseId = firstSet.exercise_id
        const muscleGroupId = (firstSet.exercises as any).muscle_group_id
        
        setSelectedExercise(exerciseId)
        setSelectedMuscleGroup(muscleGroupId)
        
        // Converter os sets
        const loadedSets = data.workout_sets.map((set, index) => ({
          id: (index + 1).toString(),
          weight: set.weight.toString(),
          reps: set.reps.toString()
        }))
        
        setSets(loadedSets)
      }
    } catch (err) {
      console.error('Erro ao carregar treino:', err)
      setError('Erro ao carregar treino')
    } finally {
      setIsLoading(false)
    }
  }

  const addSet = () => {
    const newId = (sets.length + 1).toString()
    setSets([...sets, { id: newId, weight: '', reps: '' }])
  }

  const replicateLastSet = () => {
    if (sets.length === 0) return
    const lastSet = sets[sets.length - 1]
    const newId = (sets.length + 1).toString()
    setSets([...sets, { id: newId, weight: lastSet.weight, reps: lastSet.reps }])
  }

  const removeSet = (id: string) => {
    if (sets.length === 1) return
    setSets(sets.filter(set => set.id !== id))
  }

  const updateSet = (id: string, field: 'weight' | 'reps', value: string) => {
    setSets(sets.map(set =>
      set.id === id ? { ...set, [field]: value } : set
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!selectedMuscleGroup || !selectedExercise) {
      setError('Selecione um grupo muscular e um exercício')
      return
    }

    if (sets.some(set => !set.weight || !set.reps)) {
      setError('Preencha peso e repetições de todas as séries')
      return
    }

    try {
      setIsSubmitting(true)

      const formData = {
        muscleGroupId: selectedMuscleGroup,
        exerciseId: selectedExercise,
        sets: sets.map((set, index) => ({
          exerciseId: selectedExercise,
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps),
          setNumber: index + 1
        }))
      }

      const result = await updateWorkout(workoutId, formData)

      if (result.error) {
        setError(result.error)
        return
      }

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
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Editar Treino</h1>
          <p className="text-muted-foreground">
            Modifique os dados do seu treino
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Treino</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seletor de Grupo Muscular */}
              <div className="space-y-2">
                <Label>Grupo Muscular</Label>
                <Select
                  value={selectedMuscleGroup}
                  onValueChange={setSelectedMuscleGroup}
                  disabled={loadingGroups}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seletor de Exercício */}
              <div className="space-y-2">
                <Label>Exercício</Label>
                <Select
                  value={selectedExercise}
                  onValueChange={setSelectedExercise}
                  disabled={!selectedMuscleGroup || loadingExercises}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o exercício" />
                  </SelectTrigger>
                  <SelectContent>
                    {exercises.map(exercise => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Séries */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Séries</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={replicateLastSet}
                      disabled={sets.length === 0}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Replicar Última
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSet}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Série
                    </Button>
                  </div>
                </div>

                <div className="space-y-3">
                  {sets.map((set, index) => (
                    <div key={set.id} className="flex items-end gap-3">
                      <div className="flex-none w-16">
                        {index === 0 && <Label className="text-xs">Série</Label>}
                        <div className="h-10 flex items-center justify-center border rounded-md bg-muted">
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        {index === 0 && (
                          <Label htmlFor={`weight-${set.id}`} className="text-xs">
                            Peso (kg)
                          </Label>
                        )}
                        <Input
                          id={`weight-${set.id}`}
                          type="number"
                          step="0.5"
                          value={set.weight}
                          onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="flex-1">
                        {index === 0 && (
                          <Label htmlFor={`reps-${set.id}`} className="text-xs">
                            Repetições
                          </Label>
                        )}
                        <Input
                          id={`reps-${set.id}`}
                          type="number"
                          value={set.reps}
                          onChange={(e) => updateSet(set.id, 'reps', e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeSet(set.id)}
                        disabled={sets.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

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
                  disabled={isSubmitting || !selectedExercise}
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
