// utils/checkWeeklyReset.ts
import { triggerWeeklyReset } from './triggerWeeklyReset'

export async function checkResetCycle(householdId: string) {
  const res = await fetch(`/api/household/${householdId}`)
  const data = await res.json()
  const lastReset = new Date(data.lastReset)
  const now = new Date()

  const diffDays = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays >= 7) {
    console.log('🔁 Triggering weekly reset...')
    await triggerWeeklyReset(householdId)
  }
}
