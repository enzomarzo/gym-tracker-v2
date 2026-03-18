import { createClient } from '@/utils/supabase/client'

export interface AiCoachAnalysis {
  id: string
  content: string
  created_at: string
}

/** Busca a análise mais recente do usuário autenticado. */
export async function getLastAnalysis(): Promise<AiCoachAnalysis | null> {
  const supabase = createClient()

  const { data } = await supabase
    .from('ai_coach_analyses')
    .select('id, content, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data ?? null
}

/** Deleta todas as análises de hoje (usado no reset). */
export async function deleteTodayAnalysis(): Promise<void> {
  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  await supabase
    .from('ai_coach_analyses')
    .delete()
    .gte('created_at', `${today}T00:00:00`)
    .lt('created_at', `${today}T23:59:59`)
}
