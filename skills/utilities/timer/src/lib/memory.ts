import {
  createTimerDb,
  getTimerMemoryByWidgetId,
  getNewestTimerMemory,
  TimerMemory
} from './memory'

export const cancelTimer = async (widgetId?: string): Promise<void> => {
  if (!widgetId) {
    return
  }
}

export const createTimerMemory = async (
  widgetId: string,
  duration: number,
  interval: number
): Promise<void> => {
  const createdAt = Date.now()
  const finishedAt = Math.floor(createdAt / 1_000) + duration

  await createTimerDb({
    widgetId,
    createdAt,
    finishedAt,
    duration,
    interval
  })
}

export { getTimerMemoryByWidgetId, getNewestTimerMemory, TimerMemory }
