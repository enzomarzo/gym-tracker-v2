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

// ---------- Gamification helpers ----------

export interface AthleteLevel {
  level: number
  title: string
  emoji: string
  minAvg: number  // média mínima de treinos/semana
  maxAvg: number | null
}

const LEVELS: AthleteLevel[] = [
  { level: 1, title: 'Iniciante',  emoji: '🌱', minAvg: 0,   maxAvg: 1.0  },
  { level: 2, title: 'Amador',  emoji: '⚔️',  minAvg: 1.0, maxAvg: 2.0  },
  { level: 3, title: 'Atleta',     emoji: '💪',  minAvg: 2.0, maxAvg: 3.0  },
  { level: 4, title: 'Veterano',   emoji: '🔥',  minAvg: 3.0, maxAvg: 4.0  },
  { level: 5, title: 'Elite',      emoji: '⭐',  minAvg: 4.0, maxAvg: 5.0  },
  { level: 6, title: 'Lenda',      emoji: '🏆',  minAvg: 5.0, maxAvg: null },
]

/**
 * Calcula o nível do atleta com base na média de treinos/semana nas últimas 8 semanas.
 */
export function getAthleteLevel(dates: string[]): AthleteLevel & { progress: number; nextLevelAt: number | null; avgPerWeek: number } {
  const WEEKS = 8
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - (WEEKS * 7 - 1))
  cutoff.setHours(0, 0, 0, 0)

  const recent = dates.filter(d => new Date(d.split('T')[0] + 'T00:00:00') >= cutoff)
  const avgPerWeek = Math.round((recent.length / WEEKS) * 10) / 10

  const current = [...LEVELS].reverse().find(l => avgPerWeek >= l.minAvg) ?? LEVELS[0]
  const nextLevel = LEVELS.find(l => l.level === current.level + 1)
  const progress = nextLevel
    ? Math.min(100, Math.round(((avgPerWeek - current.minAvg) / (nextLevel.minAvg - current.minAvg)) * 100))
    : 100

  return { ...current, progress, nextLevelAt: nextLevel?.minAvg ?? null, avgPerWeek }
}

/** Returns streak of consecutive calendar days ending today or yesterday. */
export function calculateStreak(dates: string[]): number {
  if (!dates.length) return 0
  const normalized = dates.map(d => d.split('T')[0])
  const unique = [...new Set(normalized)].sort((a, b) => b.localeCompare(a))
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let streak = 0
  let cursor = new Date(today)
  // Allow streak if last workout was yesterday or today
  const lastDate = new Date(unique[0] + 'T00:00:00')
  const diffFromToday = Math.round((today.getTime() - lastDate.getTime()) / 86400000)
  if (diffFromToday > 1) return 0

  if (diffFromToday === 1) cursor.setDate(cursor.getDate() - 1)

  const set = new Set(unique)
  while (true) {
    const key = cursor.toISOString().split('T')[0]
    if (!set.has(key)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

/** Returns activity and label for a given week offset (0 = current, -1 = last week, etc.). */
export function getWeekActivity(dates: string[], weekOffset = 0): { activity: boolean[]; label: string; trainedCount: number } {
  const set = new Set(dates.map(d => d.split('T')[0]))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dayOfWeek = today.getDay()
  const monday = new Date(today)
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + weekOffset * 7)

  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)

  const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  const label = weekOffset === 0
    ? 'Esta semana'
    : weekOffset === -1
    ? 'Semana passada'
    : `${fmt(monday)} – ${fmt(sunday)}`

  const activity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return set.has(d.toISOString().split('T')[0])
  })

  return { activity, label, trainedCount: activity.filter(Boolean).length }
}

/** @deprecated use getWeekActivity */
export function getCurrentWeekActivity(dates: string[]): boolean[] {
  return getWeekActivity(dates, 0).activity
}

export function getMotivationalMessage(streak: number, lastWorkoutDate: string | null): string {
  if (!lastWorkoutDate) return 'Vamos começar! Registre seu primeiro treino. 🚀'
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const last = new Date(lastWorkoutDate + 'T00:00:00')
  const diff = Math.round((today.getTime() - last.getTime()) / 86400000)

  if (diff === 0) {
    if (streak >= 7) return `${streak} dias seguidos! Você é uma máquina! 🔥`
    return 'Mandou bem hoje! Recupera bem pra volta mais forte. 💪'
  }
  if (diff === 1) return 'Bom descanso. Amanhã é dia de malhar! ⚡'
  if (diff === 2) return 'Dois dias de descanso... hora de voltar! 💥'
  if (diff <= 4) return `${diff} dias longe da academia. Seu físico está te chamando! 🏋️`
  return 'A academia está com saudade de você. Bora! 🚀'
}
