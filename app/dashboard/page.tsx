import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { calculateOverallPR, formatWeight } from '@/utils/calculatePR'
import { Trophy, Calendar, Dumbbell } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorkoutCard } from '@/components/WorkoutCard'
import { getDashboardData } from '@/queries/dashboard'
import { groupWorkoutsByDate } from '@/utils/workoutUtils'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    totalWorkouts,
    lastWorkout,
    workoutSets,
    recentWorkouts,
    muscleGroups
  } = await getDashboardData(user.id)

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
              {groupWorkoutsByDate(recentWorkouts as any).map((dayGroup: any) => (
                <WorkoutCard
                  key={dayGroup.date}
                  date={dayGroup.date}
                  workoutSets={dayGroup.allSets}
                  muscleGroups={muscleGroups || []}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
