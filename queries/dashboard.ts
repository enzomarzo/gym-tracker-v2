import { createClient } from '@/utils/supabase/server'

/**
 * Busca todos os dados necessários para o dashboard do usuário.
 * Deve ser usada apenas em Server Components.
 */
export async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const [
    { count: totalWorkouts },
    { data: lastWorkout },
    { data: workoutSets },
    { data: recentWorkouts },
    { data: muscleGroups }
  ] = await Promise.all([
    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId),

    supabase
      .from('workouts')
      .select('date')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(1)
      .single(),

    supabase
      .from('workout_sets')
      .select(`
        *,
        exercises (
          id,
          name,
          muscle_group_id
        ),
        workouts!inner (
          user_id
        )
      `)
      .eq('workouts.user_id', userId),

    supabase
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
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(3),

    supabase
      .from('muscle_groups')
      .select('*')
  ])

  return {
    totalWorkouts,
    lastWorkout,
    workoutSets,
    recentWorkouts,
    muscleGroups
  }
}
