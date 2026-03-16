'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dumbbell, ChevronLeft, ChevronRight } from 'lucide-react'
import { getWeekActivity } from '@/utils/workoutUtils'

const DAY_LABELS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D']
const MIN_OFFSET = -7 // até 7 semanas atrás

interface Props {
  dates: string[]
}

export function WeekActivityCard({ dates }: Props) {
  const [offset, setOffset] = useState(0)
  const { activity, label, trainedCount } = getWeekActivity(dates, offset)

  return (
    <Card className="md:col-span-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Dumbbell className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex gap-1.5 mt-1">
          {activity.map((active, i) => (
            <div key={i} className="flex flex-col items-center gap-1 flex-1">
              <div
                className={`w-full aspect-square rounded-md flex items-center justify-center text-xs font-bold transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-muted-foreground'
                }`}
              >
                {active ? '✓' : ''}
              </div>
              <span className="text-[10px] text-muted-foreground">{DAY_LABELS[i]}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {trainedCount} de 7 dias treinados
        </p>
        <div className="flex items-center justify-between mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(o => o - 1)}
            disabled={offset <= MIN_OFFSET}
            className="h-7 px-2"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="text-xs ml-1">Anterior</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOffset(o => o + 1)}
            disabled={offset >= 0}
            className="h-7 px-2"
          >
            <span className="text-xs mr-1">Próxima</span>
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
