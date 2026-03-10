'use client'

import { Dumbbell } from 'lucide-react'
import { TodayWorkoutSet } from '@/queries/workouts'

interface TodayWorkoutSummaryProps {
  workoutDate: string
  sets: TodayWorkoutSet[]
}

/**
 * Painel que exibe as séries já registradas para o dia selecionado,
 * agrupadas por exercício.
 */
export function TodayWorkoutSummary({ workoutDate, sets }: TodayWorkoutSummaryProps) {
  if (sets.length === 0) return null

  const groupedByExercise = sets.reduce((acc, set) => {
    const exerciseName = set.exercise.name
    if (!acc[exerciseName]) acc[exerciseName] = []
    acc[exerciseName].push(set)
    return acc
  }, {} as Record<string, TodayWorkoutSet[]>)

  return (
    <div className="p-4 rounded-md bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900">
      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">
        📋 Séries já adicionadas neste dia ({new Date(workoutDate).toLocaleDateString('pt-BR')})
      </h4>
      <div className="space-y-2">
        {Object.entries(groupedByExercise).map(([exerciseName, exerciseSets]) => (
          <div key={exerciseName} className="flex items-start gap-2 text-sm">
            <Dumbbell className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {exerciseName}:
              </span>{' '}
              <span className="text-blue-700 dark:text-blue-300">
                {exerciseSets.length} {exerciseSets.length === 1 ? 'série' : 'séries'} (
                {exerciseSets.map(s => `${s.weight}kg×${s.reps}`).join(', ')})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
