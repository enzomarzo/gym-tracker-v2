'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getWorkouts, WorkoutWithSets } from '@/queries/workouts'
import { filterWorkouts } from '@/utils/workoutUtils'
import { deleteWorkout } from '@/app/actions/workout'

export function useWorkoutsPage() {
  const router = useRouter()
  const [workouts, setWorkouts] = useState<WorkoutWithSets[]>([])
  const [filteredWorkouts, setFilteredWorkouts] = useState<WorkoutWithSets[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all')
  const [selectedDate, setSelectedDate] = useState<string>('all')

  useEffect(() => {
    loadWorkouts()
  }, [])

  useEffect(() => {
    setFilteredWorkouts(filterWorkouts(workouts, selectedMuscleGroup, selectedDate))
  }, [selectedMuscleGroup, selectedDate, workouts])

  const loadWorkouts = async () => {
    try {
      const data = await getWorkouts()
      setWorkouts(data)
    } catch (err) {
      console.error('Erro ao buscar treinos:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (workoutIds: string[]) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return

    try {
      for (const workoutId of workoutIds) {
        const result = await deleteWorkout(workoutId)
        if (result.error) {
          console.error('Erro ao excluir workout:', result.error)
          alert(`Erro ao excluir treino: ${result.error}`)
          return
        }
      }
      setWorkouts(prev => prev.filter(w => !workoutIds.includes(w.id)))
    } catch (err) {
      console.error('Erro ao excluir treino:', err)
      alert('Erro ao excluir treino')
    }
  }

  return {
    workouts,
    filteredWorkouts,
    loading,
    selectedMuscleGroup,
    setSelectedMuscleGroup,
    selectedDate,
    setSelectedDate,
    handleDelete,
    router
  }
}
