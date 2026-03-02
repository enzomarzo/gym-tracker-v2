import { WorkoutSet, PRRecord } from "@/types/database.types"

/**
 * Calcula o PR (Personal Record) geral - maior peso já levantado
 */
export function calculateOverallPR(workoutSets: WorkoutSet[]): PRRecord | null {
  if (workoutSets.length === 0) return null

  const maxSet = workoutSets.reduce((prev, current) => {
    return (current.weight > prev.weight) ? current : prev
  })

  return {
    exercise_id: maxSet.exercise_id,
    exercise_name: maxSet.exercises?.name || 'Desconhecido',
    max_weight: maxSet.weight,
    date: maxSet.created_at
  }
}

/**
 * Calcula o PR para um exercício específico
 */
export function calculateExercisePR(
  workoutSets: WorkoutSet[],
  exerciseId: string
): number {
  const exerciseSets = workoutSets.filter(set => set.exercise_id === exerciseId)
  
  if (exerciseSets.length === 0) return 0

  return Math.max(...exerciseSets.map(set => set.weight))
}

/**
 * Agrupa séries por treino e data, retornando o maior peso de cada treino
 * para um exercício específico (usado no gráfico de progresso)
 */
export function getProgressData(
  workoutSets: { weight: number; workout: { date: string } }[]
): { date: string; max_weight: number }[] {
  // Agrupar por data
  const groupedByDate = workoutSets.reduce((acc, set) => {
    const date = new Date(set.workout.date).toLocaleDateString('pt-BR')
    
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(set.weight)
    
    return acc
  }, {} as Record<string, number[]>)

  // Pegar o máximo de cada data
  const progressData = Object.entries(groupedByDate).map(([date, weights]) => ({
    date,
    max_weight: Math.max(...weights)
  }))

  // Ordenar por data
  return progressData.sort((a, b) => {
    const dateA = new Date(a.date.split('/').reverse().join('-'))
    const dateB = new Date(b.date.split('/').reverse().join('-'))
    return dateA.getTime() - dateB.getTime()
  })
}

/**
 * Formata o peso para exibição
 */
export function formatWeight(weight: number): string {
  return `${weight.toFixed(1)} kg`
}
