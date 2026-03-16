'use server'

import { createClient } from '@/utils/supabase/server'
import { customExerciseSchema } from '@/lib/validations/workout'

export async function createCustomExercise(data: { name: string; muscleGroupId: string }) {
  const parsed = customExerciseSchema.safeParse(data)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const { data: exercise, error } = await supabase
    .from('exercises')
    .insert({
      name: parsed.data.name,
      muscle_group_id: parsed.data.muscleGroupId,
      is_custom: true,
      created_by_user_id: user.id
    })
    .select()
    .single()

  if (error) return { error: 'Erro ao criar exercício. Tente novamente.' }

  return { exercise }
}
