'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMuscleGroups, useExercises } from '@/hooks/useExercises'
import { createWorkout } from '@/app/actions/workout'
import { Plus, Copy, Trash2 } from 'lucide-react'

interface Set {
  id: string
  weight: string
  reps: string
}

export default function NewWorkoutPage() {
  const router = useRouter()
  const { muscleGroups, loading: loadingGroups } = useMuscleGroups()
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('')
  const { exercises, loading: loadingExercises } = useExercises(selectedMuscleGroup)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [sets, setSets] = useState<Set[]>([
    { id: '1', weight: '', reps: '' },
    { id: '2', weight: '', reps: '' }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

      const result = await createWorkout(formData)

      if (result.error) {
        setError(result.error)
        return
      }

      // Limpar formulário para adicionar outro exercício
      setSelectedExercise('')
      setSets([
        { id: '1', weight: '', reps: '' },
        { id: '2', weight: '', reps: '' }
      ])
      setError(null)
      
      // Mostrar mensagem de sucesso
      alert('Exercício adicionado ao treino de hoje! Adicione mais exercícios ou volte ao dashboard.')
    } catch (err) {
      setError('Erro ao criar treino. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Novo Treino</h1>
          <p className="text-muted-foreground">
            Registre seu treino e acompanhe sua evolução
          </p>
          <div className="mt-3 p-3 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              💡 Todos os exercícios que você adicionar hoje serão agrupados no mesmo treino.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                    {exercises.map((exercise) => (
                      <SelectItem key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle>Séries</CardTitle>
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
