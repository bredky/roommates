'use client'

import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const [joinCode, setJoinCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [inHousehold, setInHousehold] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me')
        const data = await res.json()

        if (data.householdId) {
          setInHousehold(true)
          setJoinCode(data.joinCode || data.householdId)
        }
      } catch (err) {
        console.error('Failed to fetch user info', err)
      } finally {
        setLoadingUser(false)
      }
    }

    fetchUser()
  }, [])

  const handleCreateHousehold = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/household/create', {
        method: 'POST',
      })

      const data = await res.json()
      if (res.ok) {
        setJoinCode(data.joinCode)
        setInHousehold(true)
      } else {
        alert(data.error || 'Something went wrong')
      }
    } catch (err) {
      alert('Failed to create household')
    } finally {
      setLoading(false)
    }
  }

  const handleJoinHousehold = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/household/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ joinCode: inputCode.trim() }),
      })

      const data = await res.json()
      if (res.ok) {
        setJoinCode(data.joinCode)
        setInHousehold(true)
        setInputCode('')
      } else {
        alert(data.error || 'Invalid join code')
      }
    } catch (err) {
      alert('Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) return <p>Loading dashboard...</p>

  return (
    <div style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      {inHousehold ? (
        <div>
          <h2>You are already in a household</h2>
          <p>Join Code: <strong>{joinCode}</strong></p>
        </div>
      ) : (
        <>
          <button onClick={handleCreateHousehold} disabled={loading}>
            {loading ? 'Creating...' : 'Create Household'}
          </button>

          <div style={{ marginTop: 20 }}>
            <input
              placeholder="Enter join code"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              disabled={loading}
              style={{ marginRight: 10 }}
            />
            <button onClick={handleJoinHousehold} disabled={loading || !inputCode}>
              {loading ? 'Joining...' : 'Join Household'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
