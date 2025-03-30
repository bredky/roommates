'use client'

import { useEffect, useState } from 'react'
import DashboardHTML from '../api/components/DashboardHTML'

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
    assignedAt: string
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
const getDays = (task: Task) => {
  switch (task.cycle) {
    case 'weekly': return 7;
    case 'biweekly': return 14;
    case 'monthly': return 30;
    case 'custom': return task.customDays || 1;
    default: return 1;
  }
}
const markTaskDone = async (taskId: string) => {
  const res = await fetch('/api/task/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  })

  if (res.ok) {
    const updatedTasks = tasks.map(t =>
      t._id === taskId ? { ...t, completed: true, completedAt: new Date().toISOString() } : t
    )
    setTasks(updatedTasks)
  }
}
const getDueDate = (task: Task) => {
  const assignedAt = new Date(task.assignedAt)
  const due = new Date(assignedAt)
  due.setDate(assignedAt.getDate() + getDays(task))
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const sessionUserEmail = user?.email || ''


  if (loadingUser) return <p>He left the pans out didn't he?</p>

  return (
    <DashboardHTML
    user={user}
    inHousehold={inHousehold}
    joinCode={joinCode}
    members={members}
    inputCode={inputCode}
    setInputCode={setInputCode}
    handleCreateHousehold={handleCreateHousehold}
    handleJoinHousehold={handleJoinHousehold}
    loading={loading}
    taskName={taskName}
    setTaskName={setTaskName}
    selectedTaskName={selectedTaskName}
    setSelectedTaskName={setSelectedTaskName}
    showCycleSelector={showCycleSelector}
    setShowCycleSelector={setShowCycleSelector}
    cycle={cycle}
    setCycle={setCycle}
    customDays={customDays}
    setCustomDays={setCustomDays}
    addTask={addTask}
    tasks={tasks}
    deleteTask={deleteTask}
    markTaskDone={markTaskDone}
  />
    )
    
    
}
