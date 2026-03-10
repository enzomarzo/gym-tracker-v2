import { createClient } from '@/utils/supabase/client'
import { MuscleGroup } from '@/types/database.types'

export interface WorkoutSetWithExercise {
  id: string
  weight: number
  reps: number
  set_number: number
  exercise: {
    id: string
    name: string
    muscle_group_id: string
  }
}

export interface WorkoutWithSets {
  id: string
  date: string
  user_id: string
  workout_sets: WorkoutSetWithExercise[]
}

export interface TodayWorkoutSet {
  id: string
  weight: number
  reps: number
  set_number: number
  exercise: {
    name: string
    muscle_group_id: string
  }
}

export interface ExerciseGroupInput {
  exerciseId: string
  exerciseName: string
  muscleGroupName: string
  sets: { id: string; dbId: string; weight: string; reps: string }[]
}

/**
 * Busca todos os treinos do usuário autenticado com suas séries e exercícios.
 */
export async function getWorkouts(): Promise<WorkoutWithSets[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
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
    .eq('user_id', user.id)
    .order('date', { ascending: false })

  if (error) {
    console.error('Erro ao buscar treinos:', error)
    return []
  }

  return (data as any) || []
}

/**
 * Busca um treino específico pelo ID com todas as séries agrupadas por exercício.
 */
export async function getWorkoutById(workoutId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('workouts')
    .select(`
      id,
      date,
      workout_sets (
        id,
        weight,
        reps,
        set_number,
        exercise_id,
        exercises (
          id,
          name,
          muscle_groups (
            name
          )
        )
      )
    `)
    .eq('id', workoutId)
    .single()

  if (error) throw error
  return data
}

/**
 * Busca as séries já registradas em uma data específica para o usuário autenticado.
 */
export async function getTodayWorkoutSets(workoutDate: string): Promise<TodayWorkoutSet[]> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: workouts } = await supabase
    .from('workouts')
    .select(`
      id,
      workout_sets (
        id,
        weight,
        reps,
        set_number,
        exercise:exercises (
          name,
          muscle_group_id
        )
      )
    `)
    .eq('user_id', user.id)
    .gte('date', `${workoutDate}T00:00:00`)
    .lt('date', `${workoutDate}T23:59:59`)

  if (!workouts || workouts.length === 0) return []
  return workouts.flatMap(w => (w.workout_sets || []) as any)
}

/**
 * Busca o último treino de um exercício específico para pré-preencher as séries.
 */
export async function getLastWorkoutByExercise(exerciseId: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workouts')
    .select(`
      id,
      date,
      workout_sets!inner (
        weight,
        reps,
        set_number,
        exercise_id
      )
    `)
    .eq('user_id', user.id)
    .eq('workout_sets.exercise_id', exerciseId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  return data
}

/**
 * Atualiza as séries de um treino (delete + re-insert).
 */
export async function updateWorkoutSets(
  workoutId: string,
  exerciseGroups: ExerciseGroupInput[]
): Promise<void> {
  const supabase = createClient()

  const { error: deleteError } = await supabase
    .from('workout_sets')
    .delete()
    .eq('workout_id', workoutId)

  if (deleteError) throw deleteError

  const allSets = exerciseGroups.flatMap(group =>
    group.sets.map((set, index) => ({
      workout_id: workoutId,
      exercise_id: group.exerciseId,
      weight: parseFloat(set.weight),
      reps: parseInt(set.reps),
      set_number: index + 1
    }))
  )

  const { error: insertError } = await supabase
    .from('workout_sets')
    .insert(allSets)

  if (insertError) throw insertError
}
