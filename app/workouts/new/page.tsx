'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMuscleGroups, useExercises } from '@/hooks/useExercises'
import { createWorkout } from '@/app/actions/workout'
import { Plus, Copy, Trash2, PlusCircle, X } from 'lucide-react'
import { getTodayWorkoutSets, getLastWorkoutByExercise, TodayWorkoutSet } from '@/queries/workouts'
import { TodayWorkoutSummary } from './components/TodayWorkoutSummary'
import { createCustomExercise } from '@/app/actions/exercise'

interface Set {
  id: string
  weight: string
  reps: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const { muscleGroups, loading: loadingGroups } = useMuscleGroups()
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')
  const { exercises, loading: loadingExercises, refetch: refetchExercises } = useExercises(selectedMuscleGroup)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [showCreateExercise, setShowCreateExercise] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')
  const [creatingExercise, setCreatingExercise] = useState(false)
  const [createExerciseError, setCreateExerciseError] = useState<string | null>(null)
  const [workoutDate, setWorkoutDate] = useState<string>(
    new Date().toISOString().split('T')[0] // Data de hoje como padrão (YYYY-MM-DD)
  )
  const [sets, setSets] = useState<Set[]>([
    { id: '1', weight: '', reps: '' },
    { id: '2', weight: '', reps: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingLastWorkout, setLoadingLastWorkout] = useState(false)
  const [todayWorkoutSets, setTodayWorkoutSets] = useState<TodayWorkoutSet[]>([])
  const [loadingTodaySets, setLoadingTodaySets] = useState(false)

  useEffect(() => {
    if (!selectedExercise) {
      setSets([
        { id: '1', weight: '', reps: '' },
        { id: '2', weight: '', reps: '' }
      ])
      return
    }

    const fetchLastWorkout = async () => {
      setLoadingLastWorkout(true)

      setSets([
        { id: '1', weight: '', reps: '' },
        { id: '2', weight: '', reps: '' }
      ])

      try {
        const lastWorkout = await getLastWorkoutByExercise(selectedExercise)

        if (lastWorkout && lastWorkout.workout_sets && lastWorkout.workout_sets.length > 0) {
          const sortedSets = [...lastWorkout.workout_sets].sort((a: any, b: any) => a.set_number - b.set_number)

          const preFillSets = sortedSets.map((set: any, index: number) => ({
            id: (index + 1).toString(),
            weight: set.weight.toString(),
            reps: set.reps.toString()
          }))

          setSets(preFillSets)
        }
      } catch (err) {
        console.error('Erro ao buscar último treino:', err)
      } finally {
        setLoadingLastWorkout(false)
      }
    }

    fetchLastWorkout()
  }, [selectedExercise])

  // Buscar séries já adicionadas no dia selecionado
  const fetchTodayWorkoutSets = useCallback(async () => {
    if (!workoutDate) return

    setLoadingTodaySets(true)
    try {
      const sets = await getTodayWorkoutSets(workoutDate)
      setTodayWorkoutSets(sets as any)
    } catch (err) {
      console.error('Erro ao buscar séries do dia:', err)
    } finally {
      setLoadingTodaySets(false)
    }
  }, [workoutDate])

  useEffect(() => {
    fetchTodayWorkoutSets()
  }, [fetchTodayWorkoutSets])

  const handleCreateExercise = async () => {
    if (!newExerciseName.trim() || !selectedMuscleGroup) return
    setCreatingExercise(true)
    setCreateExerciseError(null)
    try {
      const result = await createCustomExercise({
        name: newExerciseName.trim(),
        muscleGroupId: selectedMuscleGroup
      })
      if (result.error) {
        setCreateExerciseError(result.error)
        return
      }
      await refetchExercises()
      setSelectedExercise(result.exercise!.id)
      setShowCreateExercise(false)
      setNewExerciseName('')
    } catch {
      setCreateExerciseError('Erro ao criar exercício. Tente novamente.')
    } finally {
      setCreatingExercise(false)
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

    if (!workoutDate) {
      setError('Selecione a data do treino')
      return
    }

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
        workoutDate,
        muscleGroupId: selectedMuscleGroup,
        exerciseId: selectedExercise,
        sets: sets.map((set, index) => ({
          exerciseId: selectedExercise,
          weight: parseFloat(set.weight),
          reps: parseInt(set.reps),
          setNumber: index + 1
        }))
      }

      const result = await createWorkout(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      setSelectedExercise('')
      setSets([
        { id: '1', weight: '', reps: '' },
        { id: '2', weight: '', reps: '' }
      ])
      setError(null)
      
      // Recarregar séries do dia
      await fetchTodayWorkoutSets()
      
      const selectedDate = new Date(workoutDate).toLocaleDateString('pt-BR')
      alert(`Exercício adicionado ao treino de ${selectedDate}! Adicione mais exercícios ou volte ao dashboard.`)
    } catch (err) {
      setError('Erro ao criar treino. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Novo Treino</h1>
          <p className="text-muted-foreground">
            Registre seu treino e acompanhe sua evolução
          </p>
          <div className="mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Todos os exercícios que você adicionar serão agrupados no treino da data selecionada.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Layout em grid com 2 colunas no desktop, stack no mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Data do Treino</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="workoutDate">Data</Label>
                  <Input
                    id="workoutDate"
                    type="date"
                    value={workoutDate}
                    onChange={(e) => setWorkoutDate(e.target.value)}
                    onClick={(e) => e.currentTarget.showPicker?.()}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:ml-auto [&::-webkit-calendar-picker-indicator]:scale-110"
                  />
                  <p className="text-xs text-muted-foreground">
                    Selecione o dia em que você realizou ou realizará o treino
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exercício</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Grupo Muscular</Label>
                <Select
                  value={selectedMuscleGroup}
                  onValueChange={(value) => {
                    setSelectedMuscleGroup(value)
                    setSelectedExercise('')
                    setShowCreateExercise(false)
                    setNewExerciseName('')
                  }}
                  disabled={loadingGroups}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo muscular" />
                  </SelectTrigger>
                  <SelectContent>
                    {muscleGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Exercício</Label>
                  {selectedMuscleGroup && !showCreateExercise && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateExercise(true)
                        setCreateExerciseError(null)
                        setNewExerciseName('')
                      }}
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <PlusCircle className="h-3 w-3" />
                      Criar novo
                    </button>
                  )}
                </div>

                {showCreateExercise ? (
                  <div className="rounded-md border p-3 space-y-3 bg-muted/40">
                    <p className="text-sm font-medium">Novo exercício</p>
                    <input
                      type="text"
                      value={newExerciseName}
                      onChange={(e) => setNewExerciseName(e.target.value)}
                      placeholder="Nome do exercício"
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      autoFocus
                      onKeyDown={async (e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          await handleCreateExercise()
                        } else if (e.key === 'Escape') {
                          setShowCreateExercise(false)
                        }
                      }}
                    />
                    {createExerciseError && (
                      <p className="text-xs text-destructive">{createExerciseError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateExercise}
                        disabled={creatingExercise || !newExerciseName.trim()}
                        className="flex-1"
                      >
                        {creatingExercise ? 'Criando...' : 'Criar'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setShowCreateExercise(false)}
                        disabled={creatingExercise}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Select
                    value={selectedExercise}
                    onValueChange={setSelectedExercise}
                    disabled={!selectedMuscleGroup || loadingExercises}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o exercício" />
                    </SelectTrigger>
                    <SelectContent>
                      {exercises.map((exercise) => (
                        <SelectItem key={exercise.id} value={exercise.id}>
                          {exercise.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </CardContent>
          </Card>
          </div>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Adicionar Série</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {sets.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={replicateLastSet}
                      className="flex-1 sm:flex-none"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Replicar
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSet}
                    className="flex-1 sm:flex-none"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Série
                  </Button>
                </div>
              </div>
              {selectedExercise && sets[0]?.weight && (
                <div className="p-3 rounded-md bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-900">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Dados do último treino carregados. Você pode ajustar os valores conforme necessário.
                  </p>
                </div>
              )}
              <TodayWorkoutSummary workoutDate={workoutDate} sets={todayWorkoutSets} />
            </CardHeader>
            <CardContent className="space-y-4">
              {sets.map((set, index) => (
                <div key={set.id} className="flex gap-4 items-end">
                  <div className="flex-shrink-0 w-10 flex items-center justify-center font-semibold">
                    #{index + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    {index === 0 && <Label htmlFor={`weight-${set.id}`}>Peso (kg)</Label>}
                    <Input
                      id={`weight-${set.id}`}
                      type="number"
                      step="0.5"
                      value={set.weight}
                      onChange={(e) => updateSet(set.id, 'weight', e.target.value)}
                      placeholder="0.0"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    {index === 0 && <Label htmlFor={`reps-${set.id}`}>Repetições</Label>}
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
                    variant="ghost"
                    size="icon"
                    onClick={() => removeSet(set.id)}
                    disabled={sets.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard')}
              disabled={isSubmitting}
              className="flex-1"
            >
              Finalizar Treino
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Salvando...' : 'Adicionar Exercício'}
            </Button>
          </div>
        </form>
      </main>
    </div>
  )
}
