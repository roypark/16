import axios from 'axios'
import {
  test,
  describe,
  expect,
  beforeAll,
  afterAll,
  afterEach
} from '@jest/globals'
import { randomUUID } from 'node:crypto'
import type { Server } from 'node:http'

import server from '@/core/http-server/http-server'
import {
  TimerMemory,
  createTimerDb,
  getTimerMemoryByWidgetId,
  deleteAllTimersMemory
} from 'skills/utilities/timer/src/lib/db'

let httpServer: Server | null = null
const urlPrefix = `${process.env.LEON_HOST}:${process.env.LEON_PORT}/api/v1`
const fetchWidgetUrl = `${urlPrefix}/fetch-widget`

const headers = {
  'X-API-Key': process.env.LEON_HTTP_API_KEY
}

const AXIOS_TIMEOUT = 30_000

describe('Fetch Widget', () => {
  let timerMemory: TimerMemory | null = null

  beforeAll(async () => {
    httpServer = await server.init()
  })

  afterEach(async () => {
    await deleteAllTimersMemory()
  })

  afterAll(() => {
    httpServer?.close()
  })

  test('should not fetch widget if skill_action and widget_id are missing', async () => {
    try {
      await axios.get(fetchWidgetUrl, {
        headers,
        timeout: AXIOS_TIMEOUT
      })
    } catch (e) {
      const error = e as { response: { data: Record<string, unknown> } }
      expect(error.response.data).toEqual({
        success: false,
        status: 400,
        code: 'missing_params',
        message: 'skill_action and widget_id are missing.',
        widget: null
      })
    }
  })

  test('should not fetch widget if skill_action is not well formatted', async () => {
    try {
      const skillAction = 'utilities:timer'
      const widgetId = randomUUID()
      await axios.get(
        `${fetchWidgetUrl}?skill_action=${skillAction}&widget_id=${widgetId}`,
        {
          headers,
          timeout: AXIOS_TIMEOUT
        }
      )
    } catch (e) {
      const error = e as { response: { data: Record<string, unknown> } }
      expect(error.response.data).toEqual({
        success: false,
        status: 400,
        code: 'skill_action_not_valid',
        message: 'skill_action is not well formatted.',
        widget: null
      })
    }
  })

  test('should not fetch widget if it does not exist', async () => {
    const skillAction = 'utilities:timer:check_timer'
    const widgetId = randomUUID()
    const { data } = await axios.get(
      `${fetchWidgetUrl}?skill_action=${skillAction}&widget_id=${widgetId}`,
      {
        headers,
        timeout: AXIOS_TIMEOUT
      }
    )

    expect(data).toEqual({
      success: true,
      status: 200,
      code: 'widget_not_fetched',
      message: 'Widget not fetched.',
      widget: null
    })
  })

  test('should fetch widget', async () => {
    const duration = 1
    const interval = 1_000
    const widgetId = 'timerwidget-1234'
    timerMemory = await createTimerDb({
      widgetId,
      createdAt: Date.now(),
      finishedAt: Date.now(),
      duration,
      interval
    })
    const skillAction = 'utilities:timer:check_timer'
    const { data } = await axios.get(
      `${fetchWidgetUrl}?skill_action=${skillAction}&widget_id=${widgetId}`,
      {
        headers,
        timeout: AXIOS_TIMEOUT
      }
    )
    const dbTimer = await getTimerMemoryByWidgetId(widgetId)
    const remainingTime =
      (dbTimer?.finishedAt ?? 0) - Math.floor(Date.now() / 1_000)
    const initialProgress = 100 - (remainingTime / duration) * 100

    expect(data.widget.id).toBe(widgetId)
    expect(data.widget.params).toEqual({
      id: widgetId,
      seconds: remainingTime,
      initialProgress: initialProgress,
      initialDuration: duration,
      interval: interval
    })
  })
})