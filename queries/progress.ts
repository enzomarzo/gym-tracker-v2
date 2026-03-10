import { createClient } from '@/utils/supabase/client'

/**
 * Busca as séries de um exercício para montar o gráfico de progresso.
 */
export async function getProgressByExercise(exerciseId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_sets')
    .select(`
      weight,
      workout:workouts!inner (
        date,
        user_id
      )
    `)
    .eq('exercise_id', exerciseId)
    .eq('workout.user_id', user.id)
    .order('workout(date)', { ascending: true })

  if (error) throw error

  return data?.map((item: any) => ({
    weight: item.weight,
    workout: { date: item.workout.date }
  })) || []
}

/**
 * Busca todas as séries do usuário com exercícios e datas para calcular
 * o progresso por grupo muscular.
 */
export async function getWorkoutSetsForMuscleGroups() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_sets')
    .select(`
      weight,
      reps,
      exercise:exercises (
        id,
        name,
        muscle_group_id
      ),
      workout:workouts!inner (
        date,
        user_id
      )
    `)
    .eq('workout.user_id', user.id)
    .order('workout(date)', { ascending: false })

  if (error) throw error
  return data || []
}
