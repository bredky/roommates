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
import { useRouter } from 'expo-router'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

export default function welcome() {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleSubmit = async () => {
    if (!email || !password || (isSignup && !name)) {
      return Alert.alert('Missing Info', 'Please fill all fields')
    }
  
    try {
      const res = await fetch(`${API_BASE}/api/auth/mobile-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name: isSignup ? name : undefined,
        }),
      })
  
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
  
      const token = data.token
      await SecureStore.setItemAsync('token', token)
  
      // 🔍 Check if user is already in a household
      const meRes = await fetch(`${API_BASE}/api/user/mobile-me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
  
      const meData = await meRes.json()
      if (!meRes.ok) throw new Error(meData.error || 'Failed to fetch user info')
  
      if (meData.householdId) {
        router.replace('/dashboard')
      } else {
        router.replace('/joincreate')
      }
    } catch (err) {
      Alert.alert('Auth Error', err.message)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>👋 Welcome, Roomie</Text>

      {!showForm ? (
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setIsSignup(false)
              setShowForm(true)
            }}
          >
            <Text style={styles.buttonText}>Sign In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              setIsSignup(true)
              setShowForm(true)
            }}
          >
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.form}>
          {isSignup && (
            <TextInput
              placeholder="Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
              placeholderTextColor="#999"
            />
          )}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor="#999"
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={[styles.button, { marginTop: 12 }]} onPress={handleSubmit}>
            <Text style={styles.buttonText}>
              {isSignup ? 'Create Account' : 'Login'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowForm(false)}>
            <Text style={styles.cancel}>← Back</Text>
          </TouchableOpacity>
        </View>
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E1E1E',
    marginBottom: 40,
  },
  buttonGroup: {
    width: '100%',
  },
  button: {
    backgroundColor: '#1E1E1E',
    padding: 14,
    borderRadius: 12,
    marginVertical: 10,
  },
  buttonText: {
    color: '#FFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#000',
  },
  cancel: {
    marginTop: 16,
    textAlign: 'center',
    color: '#333',
  },
})
