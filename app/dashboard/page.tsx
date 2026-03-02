import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateOverallPR, formatWeight } from '@/utils/calculatePR'
import { Trophy, Calendar, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const userId = user.id

  // Buscar total de treinos
  const { count: totalWorkouts } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  // Buscar último treino
  const { data: lastWorkout } = await supabase
    .from('workouts')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(1)
    .single()

  // Buscar todas as séries para calcular PR
  const { data: workoutSets } = await supabase
    .from('workout_sets')
    .select(`
      *,
      exercises (
        id,
        name,
        muscle_group_id
      ),
      workouts!inner (
        user_id
      )
    `)
    .eq('workouts.user_id', userId)

  const overallPR = workoutSets ? calculateOverallPR(workoutSets) : null

  const lastWorkoutDate = lastWorkout
    ? new Date(lastWorkout.date).toLocaleDateString('pt-BR')
    : 'Nenhum treino ainda'

  // Buscar treinos recentes com detalhes
  const { data: recentWorkouts } = await supabase
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
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(3)

  // Buscar grupos musculares
  const { data: muscleGroups } = await supabase
    .from('muscle_groups')
    .select('*')

  const getMuscleGroupName = (muscleGroupId: string) => {
    const group = muscleGroups?.find(g => g.id === muscleGroupId)
    return group?.name || 'Grupo não identificado'
  }

  const formatSets = (sets: any[]) => {
    // Verificar se todas as séries têm o mesmo peso e reps
    const firstSet = sets[0]
    const allSame = sets.every(set => set.weight === firstSet.weight && set.reps === firstSet.reps)

    if (allSame && sets.length > 1) {
      return `${sets.length} séries de ${firstSet.reps} reps com ${firstSet.weight}kg`
    }

    // Se não são todas iguais ou é apenas 1 série, listar individualmente
    return sets.map((set, idx) => ({
      text: sets.length > 1 
        ? `${idx + 1}ª série: ${set.reps} reps com ${set.weight}kg`
        : `${set.reps} reps com ${set.weight}kg`,
      id: set.id
    }))
  }

  // Agrupar workouts por data
  const groupWorkoutsByDate = (workouts: any[]) => {
    const grouped = workouts.reduce((acc, workout) => {
      const dateKey = workout.date.split('T')[0] // Pega apenas a parte da data (YYYY-MM-DD)
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: workout.date,
          allSets: []
        }
      }
      acc[dateKey].allSets.push(...workout.workout_sets)
      return acc
    }, {} as Record<string, { date: string, allSets: any[] }>)

    return Object.values(grouped)
  }

  const groupSetsByExercise = (sets: any[]) => {
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
    }, {} as Record<string, { exercise: any, sets: any[] }>)

    return Object.values(grouped)
  }

  const groupByMuscleGroup = (exerciseGroups: any[]) => {
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
    }, {} as Record<string, { muscleGroupId: string, exercises: any[] }>)

    return Object.values(byMuscleGroup)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Acompanhe sua evolução e estatísticas
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Treinos
              </CardTitle>
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalWorkouts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Treinos registrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Último Treino
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastWorkoutDate}</div>
              <p className="text-xs text-muted-foreground">
                Data do último treino
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Personal Record
              </CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {overallPR ? (
                <>
                  <div className="text-2xl font-bold">
                    {formatWeight(overallPR.max_weight)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {overallPR.exercise_name}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground">
                    Nenhum registro ainda
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Treinos Recentes */}
        {recentWorkouts && recentWorkouts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Treinos Recentes</h2>
                <p className="text-muted-foreground text-sm">
                  Seus últimos treinos registrados
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/workouts">Ver todos</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {groupWorkoutsByDate(recentWorkouts).map((dayGroup: any) => {
                const groupedSets = groupSetsByExercise(dayGroup.allSets)
                const muscleGroupSections = groupByMuscleGroup(groupedSets)
                
                return (
                  <Card key={dayGroup.date}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {new Date(dayGroup.date).toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {muscleGroupSections.map((section: any, idx: number) => (
                        <div key={idx} className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-1 bg-primary rounded-full" />
                            <h3 className="text-lg font-bold">
                              {getMuscleGroupName(section.muscleGroupId)}
                            </h3>
                          </div>
                          
                          <div className="space-y-4 pl-4">
                            {section.exercises.map(({ exercise, sets }: any) => {
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
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
