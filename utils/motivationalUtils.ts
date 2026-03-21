/**
 * Motivational message utilities.
 * Goal: 4 workouts per week — ideally 4/5 weekdays, with weekend makeup allowed.
 */

import {
  startOfWeek,
  addDays,
  differenceInCalendarDays,
  isMonday,
  getDay,
  format,
  startOfDay,
} from 'date-fns'

const WEEKLY_GOAL = 4

/** Returns the Monday of the ISO week containing `date` */
function getMonday(date: Date): Date {
  return startOfWeek(startOfDay(date), { weekStartsOn: 1 })
}

/** Counts dates in `dateSet` (YYYY-MM-DD) that fall between start and end (inclusive) */
function countInRange(dateSet: Set<string>, start: Date, end: Date): number {
  const days = differenceInCalendarDays(end, start) + 1
  return Array.from({ length: days }, (_, i) => format(addDays(start, i), 'yyyy-MM-dd'))
    .filter(d => dateSet.has(d)).length
}

function getWeekendMessage(
  weekdaysThisWeek: number,
  trainedThisWeekend: boolean,
  isSaturday: boolean
): string {
  let assessment: string
  if (weekdaysThisWeek >= WEEKLY_GOAL) {
    assessment = `Esta semana foi boa! ${weekdaysThisWeek} dias no ginásio. \n\n`
  } else if (weekdaysThisWeek === 3) {
    assessment = `Esta semana foste ${weekdaysThisWeek} dias, perto da meta, mas faltou um empurrão.\n\n`
  } else if (weekdaysThisWeek === 2) {
    assessment = `Esta semana: ${weekdaysThisWeek} dias. Abaixo da meta, o fim de semana ainda conta!\n\n`
  } else if (weekdaysThisWeek === 1) {
    assessment = `Esta semana só 1 dia no ginásio. Está na hora de mudar o padrão!\n\n`
  } else {
    assessment = `Nenhum treino esta semana. Tudo bem, o fim de semana ainda é uma oportunidade!\n\n`
  }

  if (trainedThisWeekend) {
    return `${assessment} Treinar no fim de semana já é um nível acima. Continua assim! 🔥`
  }

  if (isSaturday) {
    return `${assessment} Hoje é sábado, um treino extra conta para compensar qualquer débito! 🏋️`
  }

  return `${assessment} Último dia do fim de semana. Nova semana começa amanhã — prepara-te para começar forte! 🚀`
}

/**
 * Generates a contextual motivational message based on the current day of the week
 * and the user's workout history for the current/last week.
 *
 * @param workoutDates - ISO date strings (or YYYY-MM-DD) of all recorded workouts
 */
export function getMotivationalMessage(workoutDates: string[]): string {
  if (!workoutDates.length) {
    return 'Nenhum treino ainda. Hoje é um ótimo dia pra começar! 🎯'
  }

  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfWeek = getDay(today) // 0=Sun, 1=Mon, ..., 6=Sat

  const dateSet = new Set(workoutDates.map(d => d.split('T')[0]))
  const trainedToday = dateSet.has(todayStr)
  const thisMonday = getMonday(today)
  const thisFriday = addDays(thisMonday, 4)
  const thisSaturday = addDays(thisMonday, 5)

  // ─── Weekend ───────────────────────────────────────────────
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Conta Seg–Sex da semana ACTUAL (que acabou de terminar)
    const weekdaysThisWeek = countInRange(dateSet, thisMonday, thisFriday)

    const trainedThisWeekend = trainedToday ||
      (dayOfWeek === 0 && dateSet.has(format(thisSaturday, 'yyyy-MM-dd')))

    return getWeekendMessage(weekdaysThisWeek, trainedThisWeekend, dayOfWeek === 6)
  }

  // ─── Weekdays (Mon–Fri) ─────────────────────────────────────
  const daysFromMonday = differenceInCalendarDays(today, thisMonday) // 0=Seg … 4=Sex

  const yesterday = addDays(today, -1)
  const dayBefore = addDays(today, -2)

  const trainedBeforeToday = countInRange(dateSet, thisMonday, yesterday)
  const trainedThisWeek = trainedBeforeToday + (trainedToday ? 1 : 0)
  const weekdaysLeftInclToday = 5 - daysFromMonday

  // ─── Already trained today ─────────────────────────────────
  if (trainedToday) {
    if (trainedThisWeek >= WEEKLY_GOAL) {
      return `Meta da semana batida com ${trainedThisWeek} treino${trainedThisWeek > 1 ? 's' : ''}! Vai descansar com a consciência limpa. 🏆`
    }
    const remaining = WEEKLY_GOAL - trainedThisWeek
    return `O de hoje está pago! Ainda faltam ${remaining} treino${remaining > 1 ? 's' : ''} para bater a meta desta semana. 💪`
  }

  // ─── Monday, not yet trained ────────────────────────────────
  if (isMonday(today)) {
    return 'Nova semana, nova chance! O pontapé inicial é fundamental para dar ritmo à semana. 🚀'
  }

  // ─── Tue–Fri, not yet trained today ─────────────────────────
  const trainedYesterday = dateSet.has(format(yesterday, 'yyyy-MM-dd'))
  const trainedDayBefore = dateSet.has(format(dayBefore, 'yyyy-MM-dd'))
  const twoConsecutive = trainedYesterday && trainedDayBefore

  const neededMore = Math.max(0, WEEKLY_GOAL - trainedBeforeToday)
  const canMakeItWeekdays = neededMore <= weekdaysLeftInclToday
  const canMakeItWithWeekend = neededMore <= weekdaysLeftInclToday + 2

  if (!canMakeItWithWeekend) {
    return `⚠️ Precisas de ${neededMore} treino${neededMore > 1 ? 's' : ''} e só restam ${weekdaysLeftInclToday + 2} dias na semana. Hoje não pode falhar!`
  }

  if (!canMakeItWeekdays) {
    const deficit = neededMore - weekdaysLeftInclToday
    if (twoConsecutive) {
      return `2 dias seguidos — bom ritmo! Vais precisar de repor ${deficit} dia${deficit > 1 ? 's' : ''} no fim de semana. Hoje podes folgar. 😅`
    }
    return `Estás ${deficit} dia${deficit > 1 ? 's' : ''} atrás nos dias úteis. Ainda dá para recuperar no fim de semana! ⚡`
  }

  if (twoConsecutive) {
    return `Dois dias seguidos, top! Hoje podes folgar — mas a academia fica à tua espera se quiseres. 🛋️`
  }

  if (trainedBeforeToday === 0) {
    return `Ainda sem treinos esta semana, a academia está à tua espera hoje! 🏋️`
  }

  const doneStr = trainedBeforeToday === 1 ? '1 treino feito' : `${trainedBeforeToday} treinos feitos`
  return `${doneStr} esta semana. Bom ritmo, hoje é mais um passo para bater a meta! 💪`
}

/**
 * Returns a short status label for the motivational card title.
 */
export function getMotivationalStatus(workoutDates: string[]): string {
  if (!workoutDates.length) return 'Começa hoje! 🎯'

  const today = startOfDay(new Date())
  const todayStr = format(today, 'yyyy-MM-dd')
  const dayOfWeek = getDay(today)
  const dateSet = new Set(workoutDates.map(d => d.split('T')[0]))
  const trainedToday = dateSet.has(todayStr)
  const thisMonday = getMonday(today)
  const thisFriday = addDays(thisMonday, 4)

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    const weekdays = countInRange(dateSet, thisMonday, thisFriday)
    if (weekdays >= WEEKLY_GOAL) return 'Meta batida! 🏆'
    if (weekdays === 3) return 'Quase lá 🔥'
    if (weekdays === 2) return 'Abaixo da meta ⚡'
    return 'Semana fraca 👊'
  }

  const daysFromMonday = differenceInCalendarDays(today, thisMonday)
  const yesterday = addDays(today, -1)
  const trainedBeforeToday = countInRange(dateSet, thisMonday, yesterday)
  const trainedThisWeek = trainedBeforeToday + (trainedToday ? 1 : 0)
  const weekdaysLeft = 5 - daysFromMonday

  if (trainedToday) {
    if (trainedThisWeek >= WEEKLY_GOAL) return 'Meta batida! 🏆'
    return 'Em dia 💪'
  }

  if (isMonday(today)) return 'Nova semana 🚀'

  const neededMore = Math.max(0, WEEKLY_GOAL - trainedBeforeToday)
  if (neededMore > weekdaysLeft + 2) return 'Atenção! ⚠️'
  if (neededMore > weekdaysLeft) return 'Precisa recuperar ⚡'
  if (trainedBeforeToday >= 2) return 'Bom ritmo 🔥'
  if (trainedBeforeToday === 0) return 'Vai hoje! 🏋️'
  return 'Em progresso 💪'
}
