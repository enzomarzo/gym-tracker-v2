'use client'

import { Navbar } from '@/components/Navbar'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMuscleGroups } from '@/hooks/useExercises'
import { WorkoutCard } from '@/components/WorkoutCard'
import { useWorkoutsPage } from '@/hooks/useWorkoutsPage'
import { groupWorkoutsByDate, getUniqueDates } from '@/utils/workoutUtils'

export default function WorkoutsPage() {
  const { muscleGroups } = useMuscleGroups()
  const {
    workouts,
    filteredWorkouts,
    loading,
    selectedMuscleGroup,
    setSelectedMuscleGroup,
    selectedDate,
    setSelectedDate,
    handleDelete,
    router
  } = useWorkoutsPage()

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <p>Carregando...</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Histórico de Treinos</h1>
          <p className="text-muted-foreground">
            Visualize seus treinos organizados por dia. Cada card representa um dia completo de treino com todos os exercícios realizados.
          </p>
        </div>

        {/* Filtros */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os grupos musculares" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os grupos musculares</SelectItem>
                {muscleGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as datas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as datas</SelectItem>
                {getUniqueDates(workouts).map(date => (
                  <SelectItem key={date} value={date}>
                    {date}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lista de treinos */}
        {filteredWorkouts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                {workouts.length === 0
                  ? 'Nenhum treino registrado ainda. Comece adicionando seu primeiro treino!'
                  : 'Nenhum treino encontrado com os filtros selecionados'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {groupWorkoutsByDate(filteredWorkouts).map(dayGroup => (
              <WorkoutCard
                key={dayGroup.date}
                date={dayGroup.date}
                workoutSets={dayGroup.allSets}
                muscleGroups={muscleGroups}
                onEdit={() => router.push(`/workouts/${dayGroup.ids[0]}/edit`)}
                onDelete={() => handleDelete(dayGroup.ids)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
