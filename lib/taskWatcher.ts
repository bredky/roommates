const REASSIGN_ENDPOINT = process.env.REASSIGN_URL || 'http://localhost:3000/api/task/reassign'

const startWatcher = () => {
  const INTERVAL_MS = 60 * 1000 // Every minute

  setInterval(async () => {
    try {
      const res = await fetch(REASSIGN_ENDPOINT, {
        method: 'POST',
      })
      const data = await res.json()
      console.log('[TASK WATCHER] 🔁 Reassign result:', data)
    } catch (err) {
      console.error('[TASK WATCHER] ❌ Error hitting /api/task/reassign', err)
    }
  }, INTERVAL_MS)
}

startWatcher()
