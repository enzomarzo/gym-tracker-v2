'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Workout, WorkoutSet } from '@/types/database.types'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setWorkouts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar treinos')
    } finally {
      setLoading(false)
    }
  }

  return { workouts, loading, error, refetch: fetchWorkouts }
}

export function useWorkoutSets() {
  const [workoutSets, setWorkoutSets] = useState<WorkoutSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkoutSets()
  }, [])

  const fetchWorkoutSets = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('Usuário não autenticado')
      }

      const { data, error } = await supabase
        .from('workout_sets')
        .select(`
          *,
          exercises (
            id,
            name,
            muscle_group_id
          ),
          workouts!inner (
            id,
            user_id,
            date
          )
        `)
        .eq('workouts.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setWorkoutSets(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar séries')
    } finally {
      setLoading(false)
    }
  }

  return { workoutSets, loading, error, refetch: fetchWorkoutSets }
}
