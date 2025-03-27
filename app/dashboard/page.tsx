'use client'

import { useEffect, useState } from 'react'

type Member = {
  name: string
  email: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [joinCode, setJoinCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [inHousehold, setInHousehold] = useState(false)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingUser, setLoadingUser] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/user/me')
        const data = await res.json()

        setUser({ name: data.name, email: data.email })

        if (data.householdId) {
          setInHousehold(true)
          setJoinCode(data.joinCode || data.householdId)

          // fetch members
          const membersRes = await fetch('/api/household/members')
          const membersData = await membersRes.json()
          setMembers(membersData.members || [])
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

        // Fetch members after joining
        const membersRes = await fetch('/api/household/members')
        const membersData = await membersRes.json()
        setMembers(membersData.members || [])
      } else {
        alert(data.error || 'Invalid join code')
      }
    } catch (err) {
      alert('Failed to join household')
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) return <p>Loading your awesome dashboard...</p>

  return (
    <div style={{
      padding: 40,
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#1e1e2f', // Dark blue/gray background
      color: '#f8f8f8',            // Light text
      minHeight: '100vh'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>
        👋 Hey {user?.name || 'Roomie'}!
      </h1>

      {inHousehold ? (
        <div style={{
          background: '#2e2e40',        // Slightly lighter than page background
          padding: 20,
          borderRadius: 12,
          marginTop: 20,
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
        }}>
        
          <h2>🏠 You're part of a household!</h2>
          <p>🔐 Your join code: <strong>{joinCode}</strong></p>

          <h3 style={{ marginTop: 20 }}>🧑‍🤝‍🧑 Household Members:</h3>
          <ul>
            {members.map((m, i) => (
              <li key={i}>
                {m.name} ({m.email})
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div style={{
          background: '#3a3a55',
          padding: 20,
          borderRadius: 12,
          marginTop: 20,
          border: '1px solid #6f6f94',
          color: '#ffffff'
        }}>
          <p>🧼 Looks like you’re not in a household yet.</p>

          <button onClick={handleCreateHousehold} disabled={loading} style={{ marginRight: 10 }}>
            {loading ? 'Creating...' : '🎉 Create Household'}
          </button>

          <input
            placeholder="🔑 Enter join code"
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            disabled={loading}
            style={{ marginLeft: 10, marginRight: 10 }}
          />
          <button onClick={handleJoinHousehold} disabled={loading || !inputCode}>
            {loading ? 'Joining...' : '🚪 Join Household'}
          </button>
        </div>
      )}
    </div>
  )
}
