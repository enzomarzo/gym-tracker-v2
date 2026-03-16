import { createClient } from '@/utils/supabase/server'

/**
 * Busca todos os dados necessários para o dashboard do usuário.
 * Deve ser usada apenas em Server Components.
 */
export async function getDashboardData(userId: string) {
  const supabase = await createClient()

  const now = new Date()
  const date7DaysAgo = new Date(now)
  date7DaysAgo.setDate(now.getDate() - 6)
  const date30DaysAgo = new Date(now)
  date30DaysAgo.setDate(now.getDate() - 29)
  const date90DaysAgo = new Date(now)
  date90DaysAgo.setDate(now.getDate() - 89)

  const [
    { count: totalWorkouts },
    { data: lastWorkout },
    { count: workoutsLast7Days },
    { count: workoutsLast30Days },
    { data: recentWorkoutDates },
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
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('date', date7DaysAgo.toISOString().split('T')[0]),

    supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('date', date30DaysAgo.toISOString().split('T')[0]),

    supabase
      .from('workouts')
      .select('date')
      .eq('user_id', userId)
      .gte('date', date90DaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: false }),

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
    workoutsLast7Days,
    workoutsLast30Days,
    recentWorkoutDates: recentWorkoutDates?.map(w => w.date) ?? [],
    recentWorkouts,
    muscleGroups
  }
}
