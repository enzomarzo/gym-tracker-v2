'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Exercise, MuscleGroup } from '@/types/database.types'

export function useExercises(muscleGroupId?: string) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchExercises()
  }, [muscleGroupId])

  const fetchExercises = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      let query = supabase
        .from('exercises')
        .select(`
          *,
          muscle_groups (
            id,
            name
          )
        `)
        .order('name')

      if (muscleGroupId) {
        query = query.eq('muscle_group_id', muscleGroupId)
      }

      const { data, error } = await query

      if (error) throw error

      setExercises(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar exercícios')
    } finally {
      setLoading(false)
    }
  }

  return { exercises, loading, error, refetch: fetchExercises }
}

export function useMuscleGroups() {
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMuscleGroups()
  }, [])

  const fetchMuscleGroups = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data, error } = await supabase
        .from('muscle_groups')
        .select('*')
        .order('name')

      if (error) throw error

      setMuscleGroups(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar grupos musculares')
    } finally {
      setLoading(false)
    }
  }

  return { muscleGroups, loading, error, refetch: fetchMuscleGroups }
}
