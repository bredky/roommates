// /lib/store/useUserStore.ts

import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

interface User {
  _id: string
  name: string
  email: string
  householdId: string
  points: number
  lastWeekPoints: number
  [key: string]: any
}

interface UserStore {
  user: User | null
  lastFetched: number | null
  loading: boolean
  fetchUser: () => Promise<void>
  checkForUpdates: () => Promise<void>
}

export const useUserStore = create<UserStore>((set, get) => ({
  user: null,
  lastFetched: null,
  loading: false,

  fetchUser: async () => {
    set({ loading: true })

    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/user/mobile-me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    set({
      user: data,
      lastFetched: Date.now(),
      loading: false,
    })
  },

  checkForUpdates: async () => {
    const { lastFetched, fetchUser } = get()
    if (!lastFetched) return fetchUser()

    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/user/mobile/updated-since?timestamp=${lastFetched}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()

    if (data.hasNew) {
      await fetchUser()
    }
  },
}))
