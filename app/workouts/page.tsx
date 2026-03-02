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
              
              return (
                <Card key={workout.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        <CardTitle className="text-lg">
                          {new Date(workout.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => router.push(`/workouts/${workout.id}/edit`)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(workout.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {groupedSets.map(({ exercise, sets }) => (
                        <div key={exercise.id} className="border-l-2 border-primary pl-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Dumbbell className="h-4 w-4" />
                            <h3 className="font-semibold">{exercise.name}</h3>
                          </div>
                          <div className="space-y-1">
                            {sets.map(set => (
                              <div key={set.id} className="text-sm text-muted-foreground">
                                Série {set.set_number}: {set.weight}kg × {set.reps} reps
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
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
