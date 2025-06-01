import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

interface Task {
  _id: string
  name: string
  assignedTo: any
  completed: boolean
  fromReport: boolean
  overduePoints: number
  customDays: number
  cycle: string
  updatedAt?: string
  [key: string]: any
}

type State = {
  tasks: Task[]
  lastFetched: number | null
  loading: boolean
  fetchTasks: () => Promise<void>
  checkForUpdates: () => Promise<void>
  forceRefresh: () => Promise<void>
  completeTask: (id: string) => void     // <-- Add this
  removeTask: (id: string) => void
}

export const useTaskStore = create<State>((set, get) => ({
  tasks: [],
  lastFetched: null,
  loading: false,

  // Full fetch
  fetchTasks: async () => {
    set({ loading: true })
    const token = await SecureStore.getItemAsync('token')

    try {
      const res = await fetch(`${API_BASE}/api/task/mobile/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()

      set({
        tasks: data.tasks || [],
        lastFetched: Date.now(),
        loading: false,
      })
    } catch (error) {
      console.error('Failed to fetch tasks:', error)
      set({ loading: false })
    }
  },

  // Smart diff check using updatedAt timestamps
checkForUpdates: async () => {
  const { lastFetched, fetchTasks } = get()

  // If it's the first load, just fetch everything
  if (!lastFetched) return fetchTasks()

  const token = await SecureStore.getItemAsync('token')

  // 🚨 Add this guard to prevent malformed token errors
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⛔ No token found — skipping update check')
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/task/mobile/updated-since?timestamp=${lastFetched}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()

    if (data?.hasNew) {
      await fetchTasks()
    }
  } catch (error) {
    console.error('Failed to check for updates:', error)
  }
},
  completeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task._id === id ? { ...task, completed: true } : task
      ),
    }))
  },

  removeTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((task) => task._id !== id),
    }))
  },
  // Hard reset and reload
  forceRefresh: async () => {
    set({ lastFetched: null })
    await get().fetchTasks()
  },
}))
