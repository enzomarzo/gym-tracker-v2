import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateOverallPR, formatWeight } from '@/utils/calculatePR'
import { Trophy, Calendar, Dumbbell } from 'lucide-react'

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
      </main>
    </div>
  )
}
