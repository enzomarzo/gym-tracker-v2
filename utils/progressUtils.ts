import { MuscleGroup } from '@/types/database.types'

export interface MuscleGroupStat {
  muscleGroupId: string
  muscleGroupName: string
  avgWeightChange: number
  maxWeightChange: number
  weeklyFrequency: number
  totalWorkouts: number
  exerciseCount: number
  lastWorkoutDate: string | null
  currentAvgWeight: number
  currentMaxWeight: number
}

/**
 * Calcula estatísticas de progresso por grupo muscular.
 * Compara os últimos 30 dias com os 30 dias anteriores.
 */
export function calculateMuscleGroupStats(
  workoutSets: any[],
  muscleGroups: MuscleGroup[]
): MuscleGroupStat[] {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)

  return muscleGroups
    .map(group => {
      const groupSets = workoutSets?.filter(
        (set: any) => set.exercise?.muscle_group_id === group.id
      ) || []

      if (groupSets.length === 0) return null

      // Treinos únicos (datas únicas)
      const uniqueDates = new Set(
        groupSets.map((set: any) => new Date(set.workout.date).toDateString())
      )
      const totalWorkouts = uniqueDates.size

      // Exercícios únicos
      const uniqueExercises = new Set(groupSets.map((set: any) => set.exercise.id))
      const exerciseCount = uniqueExercises.size

      // Última data de treino
      const lastWorkoutDate = groupSets.length > 0
        ? (groupSets[0] as any).workout.date
        : null

      const recentSets = groupSets.filter(
        (set: any) => new Date(set.workout.date) >= thirtyDaysAgo
      )
      const previousSets = groupSets.filter((set: any) => {
        const date = new Date(set.workout.date)
        return date >= sixtyDaysAgo && date < thirtyDaysAgo
      })

      // Carga média atual e anterior
      const currentAvgWeight = recentSets.length > 0
        ? recentSets.reduce((acc: number, set: any) => acc + set.weight, 0) / recentSets.length
        : 0

      const previousAvgWeight = previousSets.length > 0
        ? previousSets.reduce((acc: number, set: any) => acc + set.weight, 0) / previousSets.length
        : 0

      const avgWeightChange = previousAvgWeight > 0
        ? ((currentAvgWeight - previousAvgWeight) / previousAvgWeight) * 100
        : 0

      // Carga máxima atual e anterior
      const currentMaxWeight = recentSets.length > 0
        ? Math.max(...recentSets.map((set: any) => set.weight))
        : 0

      const previousMaxWeight = previousSets.length > 0
        ? Math.max(...previousSets.map((set: any) => set.weight))
        : 0

      const maxWeightChange = previousMaxWeight > 0
        ? ((currentMaxWeight - previousMaxWeight) / previousMaxWeight) * 100
        : 0

      // Frequência semanal (últimos 30 dias)
      const recentDates = new Set(
        recentSets.map((set: any) => new Date(set.workout.date).toDateString())
      )
      const weeklyFrequency = (recentDates.size / 30) * 7

      return {
        muscleGroupId: group.id,
        muscleGroupName: group.name,
        avgWeightChange,
        maxWeightChange,
        weeklyFrequency,
        totalWorkouts,
        exerciseCount,
        lastWorkoutDate,
        currentAvgWeight,
        currentMaxWeight
      }
    })
    .filter(Boolean) as MuscleGroupStat[]
}
