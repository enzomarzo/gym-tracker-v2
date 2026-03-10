'use client'

import { useState, useEffect } from 'react'
import { useMuscleGroups } from '@/hooks/useExercises'
import { getProgressByExercise, getWorkoutSetsForMuscleGroups } from '@/queries/progress'
import { calculateMuscleGroupStats, MuscleGroupStat } from '@/utils/progressUtils'
import { getProgressData } from '@/utils/calculatePR'

export function useProgressPage() {
  const { muscleGroups } = useMuscleGroups()
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [progressData, setProgressData] = useState<{ date: string; max_weight: number }[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [viewMode, setViewMode] = useState<'muscle' | 'exercise'>('muscle')
  const [muscleGroupData, setMuscleGroupData] = useState<MuscleGroupStat[]>([])
  const [loadingMuscleData, setLoadingMuscleData] = useState(false)

  useEffect(() => {
    if (viewMode === 'muscle' && muscleGroups.length > 0) {
      loadMuscleGroupProgress()
    }
  }, [viewMode, muscleGroups])

  const loadMuscleGroupProgress = async () => {
    try {
      setLoadingMuscleData(true)
      const workoutSets = await getWorkoutSetsForMuscleGroups()
      const stats = calculateMuscleGroupStats(workoutSets as any[], muscleGroups)
      setMuscleGroupData(stats)
    } catch (err) {
      console.error('Erro ao buscar progresso por grupo muscular:', err)
      setMuscleGroupData([])
    } finally {
      setLoadingMuscleData(false)
    }
  }

  useEffect(() => {
    if (selectedExercise) {
      loadProgressData(selectedExercise)
    }
  }, [selectedExercise])

  const loadProgressData = async (exerciseId: string) => {
    try {
      setLoadingData(true)
      const rawData = await getProgressByExercise(exerciseId)
      setProgressData(getProgressData(rawData))
    } catch (err) {
      console.error('Erro ao buscar dados de progresso:', err)
      setProgressData([])
    } finally {
      setLoadingData(false)
    }
  }

  return {
    selectedExercise,
    setSelectedExercise,
    progressData,
    loadingData,
    viewMode,
    setViewMode,
    muscleGroupData,
    loadingMuscleData
  }
}
