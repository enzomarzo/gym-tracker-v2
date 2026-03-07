import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Dumbbell, Pencil, Trash2 } from 'lucide-react'

interface WorkoutSet {
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

interface WorkoutCardProps {
  date: string
  workoutSets: WorkoutSet[]
  muscleGroups?: Array<{ id: string; name: string }>
  onEdit?: () => void
  onDelete?: () => void
}

const formatSets = (sets: WorkoutSet[]) => {
  // Ordenar por set_number para garantir ordem correta
  const sortedSets = [...sets].sort((a, b) => a.set_number - b.set_number)
  
  // Agrupar séries consecutivas com mesmo peso e reps
  const groups: { count: number; weight: number; reps: number; ids: string[] }[] = []
  
  sortedSets.forEach((set) => {
    const lastGroup = groups[groups.length - 1]
    
    if (lastGroup && lastGroup.weight === set.weight && lastGroup.reps === set.reps) {
      // Adiciona à última grupo se peso e reps são iguais
      lastGroup.count++
      lastGroup.ids.push(set.id)
    } else {
      // Cria novo grupo
      groups.push({
        count: 1,
        weight: set.weight,
        reps: set.reps,
        ids: [set.id]
      })
    }
  })
  
  // Se há apenas um grupo, retornar como string
  if (groups.length === 1 && groups[0].count > 1) {
    const group = groups[0]
    return `${group.count} séries de ${group.reps} reps com ${group.weight}kg`
  }
  
  // Se há múltiplos grupos ou séries únicas, retornar como array de objetos
  return groups.map((group) => ({
    text: group.count > 1
      ? `${group.count} séries de ${group.reps} reps com ${group.weight}kg`
      : `1 série de ${group.reps} reps com ${group.weight}kg`,
    id: group.ids[0] // Usar o id da primeira série do grupo
  }))
}

const groupSetsByExercise = (sets: WorkoutSet[]) => {
  const grouped = sets.reduce((acc, set) => {
    const exerciseId = set.exercise.id
    if (!acc[exerciseId]) {
      acc[exerciseId] = {
        exercise: set.exercise,
        sets: []
      }
    }
    acc[exerciseId].sets.push(set)
    return acc
  }, {} as Record<string, { exercise: WorkoutSet['exercise'], sets: WorkoutSet[] }>)

  return Object.values(grouped)
}

const groupByMuscleGroup = (exerciseGroups: ReturnType<typeof groupSetsByExercise>) => {
  const byMuscleGroup = exerciseGroups.reduce((acc, { exercise, sets }) => {
    const muscleGroupId = exercise.muscle_group_id
    if (!acc[muscleGroupId]) {
      acc[muscleGroupId] = {
        muscleGroupId,
        exercises: []
      }
    }
    acc[muscleGroupId].exercises.push({ exercise, sets })
    return acc
  }, {} as Record<string, { muscleGroupId: string, exercises: { exercise: WorkoutSet['exercise'], sets: WorkoutSet[] }[] }>)

  return Object.values(byMuscleGroup)
}

export function WorkoutCard({ date, workoutSets, muscleGroups = [], onEdit, onDelete }: WorkoutCardProps) {
  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups.find(g => g.id === muscleGroupId)
    return group?.name || 'Grupo não identificado'
  }

  const groupedSets = groupSetsByExercise(workoutSets)
  const muscleGroupSections = groupByMuscleGroup(groupedSets)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">
              {new Date(date).toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
          </div>
          {(onEdit || onDelete) && (
            <div className="flex gap-2">
              {onEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEdit}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  title="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {muscleGroupSections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-primary rounded-full" />
              <h3 className="text-lg font-bold">
                {getMuscleGroupName(section.muscleGroupId)}
              </h3>
            </div>
            
            <div className="space-y-4 pl-4">
              {section.exercises.map(({ exercise, sets }) => {
                const formattedSets = formatSets(sets)
                return (
                  <div key={exercise.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-base">{exercise.name}</h4>
                    </div>
                    <div className="pl-6 space-y-1">
                      {typeof formattedSets === 'string' ? (
                        <p className="text-sm text-muted-foreground">
                          {formattedSets}
                        </p>
                      ) : (
                        formattedSets.map((set: any) => (
                          <p key={set.id} className="text-sm text-muted-foreground">
                            {set.text}
                          </p>
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
