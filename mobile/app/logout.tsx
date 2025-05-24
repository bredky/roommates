import React from 'react'
import { View, Button, StyleSheet } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'

export default function LogoutPage() {
  const router = useRouter()

  const handleLogout = async () => {
    await SecureStore.deleteItemAsync('token')
    router.replace('/')  // Navigate to index.tsx (root)
  }

  return (
    <View style={styles.container}>
      <Button title="Log Out" onPress={handleLogout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
})
