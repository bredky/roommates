// /lib/store/useMemberStore.ts
import { create } from 'zustand'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

interface Member {
  _id: string
  name: string
  email: string
  points: number
}

interface MemberState {
  members: Member[]
  lastFetched: number | null
  loading: boolean
  fetchMembers: () => Promise<void>
  checkForUpdates: () => Promise<void>
}

export const useMemberStore = create<MemberState>((set, get) => ({
  members: [],
  lastFetched: null,
  loading: false,

  fetchMembers: async () => {
    set({ loading: true })

    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/household/mobile-members`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()

    set({
      members: data.members || [],
      lastFetched: Date.now(),
      loading: false,
    })
  },
checkForUpdates: async () => {
  const { lastFetched, fetchMembers } = get()

  if (!lastFetched) return fetchMembers()

  const token = await SecureStore.getItemAsync('token')

  // 🛡️ Safety guard against invalid tokens
  if (!token || token === 'undefined' || token === 'null') {
    console.warn('⛔ No token found — skipping member update check')
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/household/mobile-members/updated-since?timestamp=${lastFetched}`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    if (data?.hasNew) {
      await fetchMembers()
    }
  } catch (error) {
    console.error('Failed to check for household member updates:', error)
  }
}
}))
