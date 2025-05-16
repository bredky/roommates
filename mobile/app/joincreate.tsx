import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'

const API_BASE = 'http://192.168.1.208:3000'

export default function Page() {
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [joinCode, setJoinCode] = useState('')

  const handleJoin = async () => {
    const token = await SecureStore.getItemAsync('token')
    if (!token) return Alert.alert('Error', 'Missing token')

    const res = await fetch(`${API_BASE}/api/household/mobile-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ joinCode: joinCode.trim() }),
    })

    const data = await res.json()
    if (!res.ok) {
      return Alert.alert('Join Failed', data.error || 'Invalid code')
    }

    router.replace('/dashboard')
  }

  const handleCreate = async () => {
    const token = await SecureStore.getItemAsync('token')
    if (!token) return Alert.alert('Error', 'Missing token')

    const res = await fetch(`${API_BASE}/api/household/mobile-create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })

    const data = await res.json()
    if (!res.ok) {
      return Alert.alert('Error', data.error || 'Could not create household')
    }

    router.replace('/dashboard')
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>🏡 Household Setup</Text>

      {!joining ? (
        <>
          <TouchableOpacity style={styles.button} onPress={() => setJoining(true)}>
            <Text style={styles.buttonText}>Join Household</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={handleCreate}>
            <Text style={styles.buttonText}>Create Household</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            placeholder="Enter Join Code"
            value={joinCode}
            onChangeText={setJoinCode}
            style={styles.input}
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.button} onPress={handleJoin}>
            <Text style={styles.buttonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setJoining(false)}>
            <Text style={styles.cancel}>← Back</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE600',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 10,
    marginVertical: 10,
    width: '100%',
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    width: '100%',
    color: '#000',
  },
  cancel: {
    marginTop: 16,
    color: '#333',
    textAlign: 'center',
  },
})
