import { useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'

const API_BASE = 'http://192.168.1.208:3000'

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null)
  useEffect(() => {
    const clearToken = async () => {
      await SecureStore.deleteItemAsync('token')
      console.log('🔓 Token cleared')
    }
    clearToken()
  }, [])
  
  useEffect(() => {
    const checkAuth = async () => {
      const token = await SecureStore.getItemAsync('token')
      if (!token) {
        setDestination('/welcome')
        return
      }

      try {
        const res = await fetch(`${API_BASE}/api/user/mobile-me`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        const data = await res.json()
        if (!res.ok || !data.householdId) {
          setDestination('/joincreate')
        } else {
          setDestination('/dashboard')
        }
      } catch (err) {
        console.error('❌ Error checking user:', err)
        setDestination('/welcome')
      }
    }

    checkAuth()
  }, [])

  if (!destination) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return <Redirect href={destination} />
}
