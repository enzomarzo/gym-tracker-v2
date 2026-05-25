import { createClient } from '@/utils/supabase/client'

export type TrainingGoal =
  | 'hypertrophy'
  | 'strength'
  | 'weight_loss'
  | 'endurance'
  | 'general_fitness'
  | 'rehabilitation'

export interface GoalOption {
  value: TrainingGoal
  label: string
  description: string
}

export const GOAL_OPTIONS: GoalOption[] = [
  {
    value: 'hypertrophy',
    label: 'Hipertrofia',
    description: 'Ganho de massa muscular',
  },
  {
    value: 'strength',
    label: 'Força',
    description: 'Aumentar força máxima',
  },
  {
    value: 'weight_loss',
    label: 'Perda de peso',
    description: 'Redução de gordura corporal',
  },
  {
    value: 'endurance',
    label: 'Resistência muscular',
    description: 'Melhorar resistência e condicionamento',
  },
  {
    value: 'general_fitness',
    label: 'Condicionamento geral',
    description: 'Saúde e bem-estar geral',
  },
  {
    value: 'rehabilitation',
    label: 'Reabilitação',
    description: 'Recuperação e prevenção de lesões',
  },
]

export interface UserProfile {
  goal_1: TrainingGoal
  goal_2: TrainingGoal | null
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('user_profiles')
    .select('goal_1, goal_2')
    .maybeSingle()
  return data ?? null
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')

  await supabase
    .from('user_profiles')
    .upsert(
      { user_id: user.id, goal_1: profile.goal_1, goal_2: profile.goal_2 ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )
}
