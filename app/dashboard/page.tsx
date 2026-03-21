import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Navbar } from '@/components/Navbar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Dumbbell, Flame, Trophy } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WorkoutCard } from '@/components/WorkoutCard'
import { getDashboardData } from '@/queries/dashboard'
import { groupWorkoutsByDate, getAthleteLevel, calculateStreak } from '@/utils/workoutUtils'
import { getMotivationalMessage, getMotivationalStatus } from '@/utils/motivationalUtils'
import { WeekActivityCard } from './components/WeekActivityCard'
import { AiCoachButton } from './components/AiCoachButton'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const {
    totalWorkouts,
    lastWorkout,
    workoutsLast7Days,
    workoutsLast30Days,
    recentWorkoutDates,
    recentWorkouts,
    muscleGroups
  } = await getDashboardData(user.id)

  const streak = calculateStreak(recentWorkoutDates)
  const athleteLevel = getAthleteLevel(recentWorkoutDates)
  const motivationalMessage = getMotivationalMessage(recentWorkoutDates)
  const motivationalStatus = getMotivationalStatus(recentWorkoutDates)

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

        <div className="grid gap-6 md:grid-cols-4">
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
                Últimos 7 dias
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workoutsLast7Days || 0}</div>
              <p className="text-xs text-muted-foreground">
                Idas à academia
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Últimos 30 dias
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workoutsLast30Days || 0}</div>
              <p className="text-xs text-muted-foreground">
                Idas à academia
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Gamification Section */}
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {/* Motivational message + streak */}
          <Card className="md:col-span-1 border-orange-200 dark:border-orange-900 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{motivationalStatus}</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-foreground/80 whitespace-pre-line">{motivationalMessage}</p>
            </CardContent>
          </Card>

          {/* Athlete level */}
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nível do Atleta</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{athleteLevel.emoji}</span>
                <span className="text-2xl font-bold">{athleteLevel.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                média de {athleteLevel.avgPerWeek}×/semana (últimas 8 semanas)
              </p>
              {athleteLevel.nextLevelAt !== null && (
                <>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${athleteLevel.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    precisa de {athleteLevel.nextLevelAt}×/semana para subir de nível
                  </p>
                </>
              )}
              {athleteLevel.nextLevelAt === null && (
                <p className="text-xs text-muted-foreground">Nível máximo atingido! 🏆</p>
              )}
            </CardContent>
          </Card>

          {/* This week activity */}
          <WeekActivityCard dates={recentWorkoutDates} />
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
        <AiCoachButton />
      </main>
    </div>
  )
}
