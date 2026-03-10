import { WorkoutWithSets, WorkoutSetWithExercise } from '@/queries/workouts'

export interface GroupedWorkout {
  ids: string[]
  date: string
  allSets: WorkoutSetWithExercise[]
}

/**
 * Agrupa treinos por data, consolidando todas as séries do mesmo dia.
 * Retorna os grupos ordenados conforme a ordem original dos treinos.
 */
export function groupWorkoutsByDate(workouts: WorkoutWithSets[]): GroupedWorkout[] {
  const grouped = workouts.reduce((acc, workout) => {
    const dateKey = workout.date.split('T')[0]
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
  }, {} as Record<string, GroupedWorkout>)

  return Object.values(grouped)
}

/**
 * Retorna datas únicas dos treinos formatadas em pt-BR.
 */
export function getUniqueDates(workouts: WorkoutWithSets[]): string[] {
  const dates = workouts.map(w => new Date(w.date).toLocaleDateString('pt-BR'))
  return [...new Set(dates)]
}

/**
 * Filtra a lista de treinos por grupo muscular e/ou data.
 */
export function filterWorkouts(
  workouts: WorkoutWithSets[],
  selectedMuscleGroup: string,
  selectedDate: string
): WorkoutWithSets[] {
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

  return filtered
}
