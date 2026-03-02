import { z } from 'zod'

export const workoutSetSchema = z.object({
  exerciseId: z.string().uuid('Exercício inválido'),
  weight: z
    .number({
      required_error: 'Peso é obrigatório',
      invalid_type_error: 'Peso deve ser um número'
    })
    .positive('Peso deve ser maior que zero')
    .max(1000, 'Peso muito alto'),
  reps: z
    .number({
      required_error: 'Repetições são obrigatórias',
      invalid_type_error: 'Repetições devem ser um número'
    })
    .int('Repetições devem ser um número inteiro')
    .positive('Repetições devem ser maior que zero')
    .max(500, 'Número de repetições muito alto'),
  setNumber: z.number().int().positive()
})

export const workoutFormSchema = z.object({
  muscleGroupId: z.string().uuid('Grupo muscular inválido'),
  exerciseId: z.string().uuid('Exercício inválido'),
  sets: z
    .array(workoutSetSchema)
    .min(1, 'Adicione pelo menos uma série')
    .max(20, 'Máximo de 20 séries por exercício')
})

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>
export type WorkoutFormInput = z.infer<typeof workoutFormSchema>

// Schema para criar exercício customizado
export const customExerciseSchema = z.object({
  name: z
    .string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome muito longo')
    .trim(),
  muscleGroupId: z.string().uuid('Grupo muscular inválido')
})

export type CustomExerciseInput = z.infer<typeof customExerciseSchema>
