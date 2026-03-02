'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pencil, Trash2, Calendar, Dumbbell } from 'lucide-react'
import { useMuscleGroups } from '@/hooks/useExercises'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteWorkout } from '@/app/actions/workout'

interface WorkoutSet {
  id: string
  weight: number
  reps: number
  set_number: number
  exercise: {
    id: string
    name: string
    muscle_group_id: string
  }
}

interface Workout {
  id: string
  date: string
  user_id: string
  workout_sets: WorkoutSet[]
}

export default function WorkoutsPage() {
  const router = useRouter()
  const { muscleGroups } = useMuscleGroups()
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')

  useEffect(() => {
    fetchWorkouts()
  }, [])

  useEffect(() => {
    filterWorkouts()
  }, [selectedMuscleGroup, selectedDate, workouts])

  const fetchWorkouts = async () => {
    try {
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('workouts')
        .select(`
          id,
          date,
          user_id,
          workout_sets (
            id,
            weight,
            reps,
            set_number,
            exercise:exercises (
              id,
              name,
              muscle_group_id
            )
          )
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false })

      if (error) {
        console.error('Erro ao buscar treinos:', error)
        return
      }

      setWorkouts(data as any || [])
    } catch (err) {
      console.error('Erro ao buscar treinos:', err)
    } finally {
      setLoading(false)
    }
  }

  const filterWorkouts = () => {
    let filtered = [...workouts]

    if (selectedMuscleGroup !== 'all') {
      filtered = filtered.filter(workout =>
        workout.workout_sets.some(
          set => set.exercise.muscle_group_id === selectedMuscleGroup
        )
      )
    }

    if (selectedDate !== 'all') {
      filtered = filtered.filter(workout => {
        const workoutDate = new Date(workout.date).toLocaleDateString('pt-BR')
        return workoutDate === selectedDate
      })
    }

    setFilteredWorkouts(filtered)
  }

  const handleDelete = async (workoutId: string) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return

    try {
      await deleteWorkout(workoutId)
      setWorkouts(workouts.filter(w => w.id !== workoutId))
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      alert('Erro ao excluir treino')
    }
  }

  const getUniqueDates = () => {
    const dates = workouts.map(w => new Date(w.date).toLocaleDateString('pt-BR'))
    return [...new Set(dates)]
  }

  const groupSetsByExercise = (sets: WorkoutSet[]) => {
    const grouped = sets.reduce((acc, set) => {
      const exerciseId = set.exercise.id
      if (!acc[exerciseId]) {
        acc[exerciseId] = {
          exercise: set.exercise,
          sets: []
        }
      }
      acc[exerciseId].sets.push(set)
      return acc
    }, {} as Record<string, { exercise: WorkoutSet['exercise'], sets: WorkoutSet[] }>)

    return Object.values(grouped)
  }

  const groupByMuscleGroup = (exerciseGroups: ReturnType<typeof groupSetsByExercise>) => {
    const byMuscleGroup = exerciseGroups.reduce((acc, { exercise, sets }) => {
      const muscleGroupId = exercise.muscle_group_id
      if (!acc[muscleGroupId]) {
        acc[muscleGroupId] = {
          muscleGroupId,
          exercises: []
        }
      }
      acc[muscleGroupId].exercises.push({ exercise, sets })
      return acc
    }, {} as Record<string, { muscleGroupId: string, exercises: { exercise: WorkoutSet['exercise'], sets: WorkoutSet[] }[] }>)

    return Object.values(byMuscleGroup)
  }

  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find(g => g.id === muscleGroupId)
    return group?.name || 'Grupo não identificado'
  }

  const formatSets = (sets: WorkoutSet[]) => {
    // Verificar se todas as séries têm o mesmo peso e reps
    const firstSet = sets[0]
    const allSame = sets.every(set => set.weight === firstSet.weight && set.reps === firstSet.reps)

    if (allSame && sets.length > 1) {
      return `${sets.length} séries de ${firstSet.reps} reps com ${firstSet.weight}kg`
    }

    // Se não são todas iguais ou é apenas 1 série, listar individualmente
    return sets.map((set, idx) => ({
      text: sets.length > 1 
        ? `${idx + 1}ª série: ${set.reps} reps com ${set.weight}kg`
        : `${set.reps} reps com ${set.weight}kg`,
      id: set.id
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Meus Treinos</h1>
          <p className="text-muted-foreground">
            Visualize, edite e gerencie seus treinos
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os grupos musculares" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos musculares</SelectItem>
                {muscleGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {getUniqueDates().map(date => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de treinos */}
        {filteredWorkouts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Nenhum treino encontrado com os filtros selecionados
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredWorkouts.map(workout => {
              const groupedSets = groupSetsByExercise(workout.workout_sets)
              const muscleGroupSections = groupByMuscleGroup(groupedSets)
              
              return (
                <Card key={workout.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span className="text-sm">
                            {new Date(workout.date).toLocaleDateString('pt-BR', {
                              weekday: 'long',
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => router.push(`/workouts/${workout.id}/edit`)}
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(workout.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {muscleGroupSections.map((section, idx) => (
                      <div key={idx} className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-1 bg-primary rounded-full" />
                          <h3 className="text-lg font-bold">
                            {getMuscleGroupName(section.muscleGroupId)}
                          </h3>
                        </div>
                        
                        <div className="space-y-4 pl-4">
                          {section.exercises.map(({ exercise, sets }) => {
                            const formattedSets = formatSets(sets)
                            
                            return (
                              <div key={exercise.id} className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                                  <h4 className="font-semibold text-base">{exercise.name}</h4>
                                </div>
                                <div className="pl-6">
                                  {typeof formattedSets === 'string' ? (
                                    <p className="text-sm text-muted-foreground">{formattedSets}</p>
                                  ) : (
                                    <div className="space-y-1">
                                      {formattedSets.map(set => (
                                        <p key={set.id} className="text-sm text-muted-foreground">
                                          {set.text}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
