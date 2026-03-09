'use server'

import { workoutFormSchema } from '@/lib/validations/workout'
import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createWorkout(formData: unknown) {
  // 1. Validar dados
  const result = workoutFormSchema.safeParse(formData)
  
  if (!result.success) {
    return {
      error: 'Dados inválidos',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  try {
    // 2. Verificar usuário autenticado
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Usuário não autenticado' }
    }

    // 3. Buscar ou criar workout do dia
    const workoutDate = result.data.workoutDate
    
    // Verificar se já existe workout nessa data
    const { data: existingWorkout } = await supabase
      .from('workouts')
      .select('id')
      .eq('user_id', user.id)
      .gte('date', `${workoutDate}T00:00:00`)
      .lt('date', `${workoutDate}T23:59:59`)
      .single()

    let workoutId: string

    if (existingWorkout) {
      // Usar workout existente
      workoutId = existingWorkout.id
    } else {
      // Criar novo workout com a data especificada
      const { data: newWorkout, error: workoutError } = await supabase
        .from('workouts')
        .insert({ 
          user_id: user.id,
          date: `${workoutDate}T12:00:00` // Meio-dia para evitar problemas de fuso horário
        })
        .select()
        .single()

      if (workoutError) {
        console.error('Erro ao criar workout:', workoutError)
        return { error: 'Erro ao criar treino' }
      }

      workoutId = newWorkout.id
    }

    // 4. Criar sets
    const setsToInsert = result.data.sets.map((set) => ({
      workout_id: workoutId,
      exercise_id: set.exerciseId,
      weight: set.weight,
      reps: set.reps,
      set_number: set.setNumber
    }))

    const { error: setsError } = await supabase
      .from('workout_sets')
      .insert(setsToInsert)

    if (setsError) {
      console.error('Erro ao criar séries:', setsError)
      return { error: 'Erro ao criar séries do treino' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/progress')
    revalidatePath('/workouts')
    
    return { success: true }
  } catch (err) {
    console.error('Erro geral:', err)
    return { error: 'Erro ao salvar treino. Tente novamente.' }
  }
}

export async function deleteWorkout(workoutId: string) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Usuário não autenticado' }
    }

    // Verificar se o workout pertence ao usuário
    const { data: workout } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single()

    if (!workout || workout.user_id !== user.id) {
      return { error: 'Treino não encontrado' }
    }

    // Deletar workout (cascade vai deletar os sets)
    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)

    if (error) {
      console.error('Erro ao deletar workout:', error)
      return { error: 'Erro ao excluir treino' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/progress')
    revalidatePath('/workouts')
    
    return { success: true }
  } catch (err) {
    console.error('Erro ao deletar:', err)
    return { error: 'Erro ao excluir treino. Tente novamente.' }
  }
}

export async function updateWorkout(workoutId: string, formData: unknown) {
  // 1. Validar dados
  const result = workoutFormSchema.safeParse(formData)
  
  if (!result.success) {
    return {
      error: 'Dados inválidos',
      fieldErrors: result.error.flatten().fieldErrors
    }
  }

  try {
    // 2. Verificar usuário autenticado
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'Usuário não autenticado' }
    }

    // 3. Verificar se o workout pertence ao usuário
    const { data: workout } = await supabase
      .from('workouts')
      .select('user_id')
      .eq('id', workoutId)
      .single()

    if (!workout || workout.user_id !== user.id) {
      return { error: 'Treino não encontrado' }
    }

    // 4. Deletar sets existentes
    const { error: deleteSetsError } = await supabase
      .from('workout_sets')
      .delete()
      .eq('workout_id', workoutId)

    if (deleteSetsError) {
      console.error('Erro ao deletar séries antigas:', deleteSetsError)
      return { error: 'Erro ao atualizar treino' }
    }

    // 5. Criar novos sets
    const setsToInsert = result.data.sets.map((set) => ({
      workout_id: workoutId,
      exercise_id: set.exerciseId,
      weight: set.weight,
      reps: set.reps,
      set_number: set.setNumber
    }))

    const { error: setsError } = await supabase
      .from('workout_sets')
      .insert(setsToInsert)

    if (setsError) {
      console.error('Erro ao criar séries:', setsError)
      return { error: 'Erro ao criar séries do treino' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/progress')
    revalidatePath('/workouts')
    
    return { success: true }
  } catch (err) {
    console.error('Erro geral:', err)
    return { error: 'Erro ao atualizar treino. Tente novamente.' }
  }
}
