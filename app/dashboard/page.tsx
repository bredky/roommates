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
  type Task = {
    _id: string
    name: string
    assignedTo?: {
      name: string
      email: string
    }
    completed: boolean
    cycle: 'weekly' | 'biweekly' | 'monthly' | 'indefinite' | 'custom'
    customDays?: number
  }
  const [taskName, setTaskName] = useState('')
  const [tasks, setTasks] = useState<Task[]>([])
  const presetTasks = [
  'Do the dishes',
  'Clean kitchen surfaces',
  'Take out the trash',
  'Vacuum living room',
  'Wipe down stove',
  'Mop floors',
  'Refill supplies',
  'Clean fridge',
  'Water plants'
]
const [selectedTaskName, setSelectedTaskName] = useState('')
const [showCycleSelector, setShowCycleSelector] = useState(false)
const [cycle, setCycle] = useState<'weekly' | 'biweekly' | 'monthly' | 'indefinite' | 'custom'>('weekly')
const [customDays, setCustomDays] = useState<number | null>(null)


  useEffect(() => {
  if (inHousehold) fetchTasks()
}, [inHousehold])

  const fetchTasks = async () => {
    const res = await fetch('/api/task/get')
    const data = await res.json()
    setTasks(data.tasks || [])
}

  const addTask = async () => {
    const res = await fetch('/api/task/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: selectedTaskName,
        cycle,
        customDays: cycle === 'custom' ? customDays : null,
      }),
    })
  
    if (res.ok) {
      const { task } = await res.json()
      setTasks(prev => [...prev, task])
      setSelectedTaskName('')
      setShowCycleSelector(false)
      setCycle('weekly')
      setCustomDays(null)
    }
  }
  

  const deleteTask = async (id: string) => {
    const res = await fetch('/api/task/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: id }),
    })

  if (res.ok) setTasks(tasks.filter(t => t._id !== id))
}


  if (loadingUser) return <p>He left the pans out didn't he?</p>

  return (
      <div style={{
        padding: 40,
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#1e1e2f',
        color: '#f8f8f8',
        minHeight: '100vh'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 10 }}>
          👋 Hey {user?.name || 'Roomie'}!
        </h1>
    
        {inHousehold ? (
          <div style={{
            background: '#2e2e40',
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
    
        {inHousehold && (
          <div style={{
            marginTop: 40,
            background: '#2b2b3d',
            padding: 20,
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{ marginBottom: 10 }}>📝 Household Tasks</h2>
    
            {!showCycleSelector ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: 20 }}>
                  {presetTasks.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedTaskName(t)
                        setShowCycleSelector(true)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#3d3d5c',
                        color: '#fff',
                        border: '1px solid #5a5a7a',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      ➕ {t}
                    </button>
                  ))}
                </div>
    
                <div style={{ marginBottom: 20 }}>
                  <input
                    placeholder="✍️ Custom task..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    style={{ marginRight: 10, padding: '6px 8px' }}
                  />
                  <button
                    onClick={() => {
                      setSelectedTaskName(taskName)
                      setShowCycleSelector(true)
                    }}
                    disabled={!taskName}
                  >
                    ➕ Add Custom Task
                  </button>
                </div>
              </>
            ) : (
              <div style={{ background: '#3a3a55', padding: 20, borderRadius: 12 }}>
                <h3>🌀 How often should "{selectedTaskName}" repeat?</h3>
                <select
                  value={cycle}
                  onChange={(e) => setCycle(e.target.value as any)}
                  style={{ marginRight: 10, marginTop: 10 }}
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                  <option value="indefinite">One-Time</option>
                </select>
    
                {cycle === 'custom' && (
                  <input
                    type="number"
                    placeholder="Enter # of days"
                    value={customDays ?? ''}
                    onChange={(e) => setCustomDays(parseInt(e.target.value))}
                    min={1}
                    style={{ marginLeft: 10 }}
                  />
                )}
    
                <div style={{ marginTop: 20 }}>
                  <button
                    onClick={addTask}
                    disabled={cycle === 'custom' && !customDays}
                  >
                    ✅ Add Task
                  </button>
                  <button
                    onClick={() => {
                      setShowCycleSelector(false)
                      setSelectedTaskName('')
                      setCycle('weekly')
                      setCustomDays(null)
                    }}
                    style={{ marginLeft: 10 }}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            )}
    
            <h4 style={{ margin: '20px 0 10px' }}>📋 Current Tasks:</h4>
            <ul>
              {tasks.map((t) => (
                <li key={t._id} style={{ marginBottom: 8 }}>
                  ✅ <strong>{t.name}</strong>{' '}
                  {t.cycle && <em>({t.cycle === 'custom' ? `${t.customDays} day cycle` : t.cycle})</em>}{' '}
                  {t.assignedTo?.name && <span>- Assigned to {t.assignedTo.name}</span>}
                  <button
                    onClick={() => deleteTask(t._id)}
                    style={{
                      marginLeft: 10,
                      background: '#ff4d4d',
                      border: 'none',
                      borderRadius: 4,
                      color: 'white',
                      padding: '4px 8px',
                      cursor: 'pointer'
                    }}
                  >
                    ❌ Remove
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
    
}
