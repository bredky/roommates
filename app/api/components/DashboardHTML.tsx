'use client'

import React from 'react'

type Member = {
  name: string
  email: string
}

type Props = {
  user: { name: string; email: string } | null
  inHousehold: boolean
  joinCode: string
  members: Member[]
  inputCode: string
  setInputCode: (val: string) => void
  handleCreateHousehold: () => void
  handleJoinHousehold: () => void
  loading: boolean
  taskName: string
  setTaskName: (val: string) => void
  selectedTaskName: string
  setSelectedTaskName: (val: string) => void
  showCycleSelector: boolean
  setShowCycleSelector: (val: boolean) => void
  cycle: string
  setCycle: (val: any) => void
  customDays: number | null
  setCustomDays: (val: number | null) => void
  addTask: () => void
  tasks: Task[]
  deleteTask: (id: string) => void
  markTaskDone: (id: string) => void
}
type Task = {
    _id: string
    name: string
    assignedTo?: {
      name: string
      email: string
    }
    assignedAt: string
    completed: boolean
    cycle: 'weekly' | 'biweekly' | 'monthly' | 'indefinite' | 'custom'
    customDays?: number
  }
export default function DashboardHTML(props: Props) {
  const {
    user,
    inHousehold,
    joinCode,
    members,
    inputCode,
    setInputCode,
    handleCreateHousehold,
    handleJoinHousehold,
    loading,
    taskName,
    setTaskName,
    selectedTaskName,
    setSelectedTaskName,
    showCycleSelector,
    setShowCycleSelector,
    cycle,
    setCycle,
    customDays,
    setCustomDays,
    addTask,
    tasks,
    deleteTask,
    markTaskDone,
  } = props

  const presetTasks = [
    'Do the dishes',
    'Clean kitchen surfaces',
    'Take out the trash',
    'Vacuum living room',
    'Wipe down stove',
    'Mop floors',
    'Refill supplies',
    'Clean fridge',
    'Water plants',
  ]

  const getDays = (task: Task) => {
    switch (task.cycle) {
      case 'weekly': return 7
      case 'biweekly': return 14
      case 'monthly': return 30
      case 'custom': return task.customDays || 1
      default: return 1
    }
  }

  const sessionUserEmail = user?.email || ''

  if (!user) return <p>He left the pans out didn't he?</p>

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
    
        {/* Household status */}
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
    
        {/* Tasks section */}
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
                    step="0.001"
                    placeholder="Enter # of days"
                    value={customDays ?? ''}
                    onChange={(e) => setCustomDays(parseFloat(e.target.value))}
                    min={0.001}
                    style={{ marginLeft: 10 }}
                  />
                )}
    
                <div style={{ marginTop: 20 }}>
                  <button onClick={addTask} disabled={cycle === 'custom' && !customDays}>
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
            {[...tasks]
                .sort((a, b) => {
                    const getDeadline = (task: Task) => {
                    const assignedAt = new Date(task.assignedAt)
                    const days = task.cycle === 'weekly'
                        ? 7
                        : task.cycle === 'biweekly'
                        ? 14
                        : task.cycle === 'monthly'
                        ? 30
                        : task.cycle === 'custom'
                        ? task.customDays || 1
                        : 365 * 10 // indefinite tasks go to the bottom
                    const deadline = new Date(assignedAt)
                    deadline.setDate(deadline.getDate() + days)
                    return deadline
                    }

                    const deadlineA = getDeadline(a)
                    const deadlineB = getDeadline(b)
                    return deadlineA.getTime() - deadlineB.getTime()
                })
                .map((t) => {
                const assignedAt = new Date(t.assignedAt)
                const days = t.cycle === 'weekly' ? 7
                  : t.cycle === 'biweekly' ? 14
                  : t.cycle === 'monthly' ? 30
                  : t.cycle === 'custom' ? t.customDays || 1
                  : 1
                const durationMs = days * 24 * 60 * 60 * 1000
                const deadline = new Date(assignedAt.getTime() + durationMs)  
                const now = new Date()
                const isOverdue = !t.completed && now > deadline
    
                return (
                  <li key={t._id} style={{
                    marginBottom: 12,
                    background: '#3a3a55',
                    padding: '10px 14px',
                    borderRadius: 8,
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    color: '#fff'
                  }}>
                    <strong style={{ fontSize: '1.1rem' }}>{t.name}</strong>
    
                    <div style={{ fontSize: '0.9rem', marginTop: 4 }}>
                      👤 Assigned to: <strong>{t.assignedTo?.name || 'Unknown'}</strong>
                    </div>
    
                    <div style={{ fontSize: '0.9rem', marginTop: 2 }}>
                      ⏰ Due: <strong>{deadline.toLocaleDateString()}</strong>
                    </div>
    
                    <div style={{ fontSize: '0.9rem', marginTop: 2 }}>
                      {t.completed ? (
                        <span style={{ color: 'limegreen' }}>✅ Completed</span>
                      ) : isOverdue ? (
                        <span style={{ color: 'orange' }}>⚠️ Overdue</span>
                      ) : (
                        <span style={{ color: 'skyblue' }}>🕒 In Progress</span>
                      )}
                    </div>
    
                    {!t.completed && user && t.assignedTo?.email === user.email && (
                      <button
                        onClick={() => markTaskDone(t._id)}
                        style={{
                          marginTop: 10,
                          alignSelf: 'flex-start',
                          background: '#4caf50',
                          border: 'none',
                          borderRadius: 4,
                          color: 'white',
                          padding: '4px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        ✅ Mark as Done
                      </button>
                    )}
    
                    <button
                      onClick={() => deleteTask(t._id)}
                      style={{
                        marginTop: 6,
                        alignSelf: 'flex-start',
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
                    <button
                        onClick={() => {
                            fetch('/api/task/reassign', { method: 'POST' })
                            .then(res => res.json())
                            .then(data => console.log('🔁 Reassign result:', data))
                        }}
                        style={{
                            marginTop: 6,
                        alignSelf: 'flex-start',
                        background: 'yellow',
                        border: 'none',
                        borderRadius: 4,
                        color: 'black',
                        padding: '4px 8px',
                        cursor: 'pointer'
                        }}
                        >
                        🔁 Force Reassign Check (for testing)
                    </button>

                  </li>
                )
              })}
            </ul>
          </div>
        )}
      </div>
  )
}
