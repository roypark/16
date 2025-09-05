import { Memory } from '@sdk/memory'

export interface TimerMemory {
  widgetId: string
  duration: number
  interval: number
  createdAt: number
  finishedAt: number
}

const TIMERS_MEMORY = new Memory<TimerMemory[]>({
  name: 'timers',
  defaultMemory: []
})

export const createTimerDb = async (
  timerMemory: TimerMemory
): Promise<TimerMemory> => {
  const timersMemory = await TIMERS_MEMORY.read()

  await TIMERS_MEMORY.write([...timersMemory, timerMemory])

  return timerMemory
}

export const getTimerMemoryByWidgetId = async (
  widgetId: string
): Promise<TimerMemory | null> => {
  const timersMemory = await TIMERS_MEMORY.read()

  return timersMemory.find((timer) => timer.widgetId === widgetId) || null
}

export const getNewestTimerMemory = async (): Promise<TimerMemory | null> => {
  const timersMemory = await TIMERS_MEMORY.read()

  return timersMemory[timersMemory.length - 1] || null
}

export const deleteAllTimersMemory = (): Promise<TimerMemory[]> => {
  return TIMERS_MEMORY.write([])
}