export interface MuscleGroup {
  id: string
  name: string
  created_at: string
}

export interface Exercise {
  id: string
  name: string
  muscle_group_id: string
  is_custom: boolean
  created_by_user_id: string | null
  created_at: string
  muscle_groups?: MuscleGroup
}

export interface Workout {
  id: string
  user_id: string
  date: string
  created_at: string
}

export interface WorkoutSet {
  id: string
  workout_id: string
  exercise_id: string
  weight: number
  reps: number
  set_number: number
  created_at: string
  exercises?: Exercise
}

export interface WorkoutWithSets extends Workout {
  workout_sets: (WorkoutSet & { exercises: Exercise })[]
}

export interface PRRecord {
  exercise_id: string
  exercise_name: string
  max_weight: number
  date: string
}

export interface ProgressData {
  date: string
  max_weight: number
}
