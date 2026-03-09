'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMuscleGroups } from '@/hooks/useExercises'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { deleteWorkout } from '@/app/actions/workout'
import { WorkoutCard } from '@/components/WorkoutCard'

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

  const handleDelete = async (workoutIds: string[]) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return

    try {
      // Deletar todos os workouts do dia
      for (const workoutId of workoutIds) {
        const result = await deleteWorkout(workoutId)
        if (result.error) {
          console.error('Erro ao excluir workout:', result.error)
          alert(`Erro ao excluir treino: ${result.error}`)
          return
        }
      }
      
      // Atualizar estado local
      setWorkouts(workouts.filter(w => !workoutIds.includes(w.id)))
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      alert('Erro ao excluir treino')
    }
  }

  const getUniqueDates = () => {
    const dates = workouts.map(w => new Date(w.date).toLocaleDateString('pt-BR'))
    return [...new Set(dates)]
  }

  // Agrupar workouts por data
  const groupWorkoutsByDate = (workouts: Workout[]) => {
    const grouped = workouts.reduce((acc, workout) => {
      const dateKey = workout.date.split('T')[0] // Pega apenas a parte da data (YYYY-MM-DD)
      if (!acc[dateKey]) {
        acc[dateKey] = {
          ids: [],
          date: workout.date,
          allSets: []
        }
      }
      acc[dateKey].ids.push(workout.id)
      acc[dateKey].allSets.push(...workout.workout_sets)
      return acc
    }, {} as Record<string, { ids: string[], date: string, allSets: WorkoutSet[] }>)

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
          <h1 className="text-3xl font-bold mb-2">Histórico de Treinos</h1>
          <p className="text-muted-foreground">
            Visualize seus treinos organizados por dia. Cada card representa um dia completo de treino com todos os exercícios realizados.
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
                {workouts.length === 0 
                  ? 'Nenhum treino registrado ainda. Comece adicionando seu primeiro treino!'
                  : 'Nenhum treino encontrado com os filtros selecionados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupWorkoutsByDate(filteredWorkouts).map((dayGroup) => (
              <WorkoutCard
                key={dayGroup.date}
                date={dayGroup.date}
                workoutSets={dayGroup.allSets}
                muscleGroups={muscleGroups}
                onEdit={() => router.push(`/workouts/${dayGroup.ids[0]}/edit`)}
                onDelete={() => handleDelete(dayGroup.ids)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
