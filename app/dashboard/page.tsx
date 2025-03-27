// app/dashboard/page.tsx
'use client'

import { useState } from 'react'

export default function DashboardPage() {
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreateHousehold = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
      })

      const data = await res.json()
      if (res.ok) {
        setJoinCode(data.joinCode)
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Failed to create household')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>
      {!joinCode && (
        <button onClick={handleCreateHousehold} disabled={loading}>
          {loading ? 'Creating...' : 'Create Household'}
        </button>
      )}
      {joinCode && (
        <div>
          <h2>Household Created!</h2>
          <p>Join Code: <strong>{joinCode}</strong></p>
        </div>
      )}
    </div>
  )
}
