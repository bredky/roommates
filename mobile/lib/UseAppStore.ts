import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type User = {
    _id: string
    name: string
    email: string
    householdId?: string
    points?: number
  }

  type Task = {
    _id: string
    name: string
    householdId: string
    completed: boolean
    assignedTo: string
    assignedAt: string // use Date if parsed
    cycle: 'weekly' | 'biweekly' | 'monthly' | 'custom' | 'indefinite'
    customDays: number | null
    completedAt: string | null
    history: {
      user: string
      assignedAt: string
      completedAt: string | null
      deadline: string
    }[]
  }

  
  type Member = {
    _id: string
    name: string
    points: number
  }  
  type Activity = {
    _id: string
    type: 'create' | 'complete' | 'delete' | 'reassign' | 'join' | 'leave' | 'custom'
    taskName?: string
    deletedBy?: string
    points?: number
    timestamp: string
    user: {
      name: string
      email: string
    }
    householdId: string
  }
   type Household = {
    _id: string
    name?: string
    joinCode: string
    members: string[]
    tasks: string[]
  }

  interface AppStore {
    user: User | null
    tasks: Task[]
    members: Member[]
    activity: Activity[]
    household: Household | null
  
    setUser: (user: User | null) => void
    setTasks: (tasks: Task[]) => void
    setMembers: (members: Member[]) => void
    setActivity: (activity: Activity[]) => void
    setHousehold: (household: Household | null) => void
    reset: () => void
  }

  export const useAppStore = create<AppStore>()(
    persist(
      (set) => ({
        user: null,
        tasks: [],
        members: [],
        activity: [],
        household: null,
  
        setUser: (user) => set({ user }),
        setTasks: (tasks) => set({ tasks }),
        setMembers: (members) => set({ members }),
        setActivity: (activity) => set({ activity }),
        setHousehold: (household) => set({ household }),
  
        reset: () =>
          set({
            user: null,
            tasks: [],
            members: [],
            activity: [],
            household: null,
          }),
      }),
      {
        name: 'roommate-store', // Key in localStorage
      }
    )
  )