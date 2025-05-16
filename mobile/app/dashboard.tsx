// /mobile/app/dashboard.tsx

import { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { RefreshControl } from 'react-native'

import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000' // replace with your IP
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

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [joinCode, setJoinCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [inHousehold, setInHousehold] = useState(false)
  const [members, setMembers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [selectedTask, setSelectedTask] = useState('')
  const [cycle, setCycle] = useState('weekly')
  const [customDays, setCustomDays] = useState('')
  const [showCycleSelect, setShowCycleSelect] = useState(false)
  const [customTaskInput, setCustomTaskInput] = useState('')
  const [refreshing, setRefreshing] = useState(false)


  useEffect(() => {
    const load = async () => {
      const token = await SecureStore.getItemAsync('token')
      const res = await fetch(`${API_BASE}/api/user/mobile-me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      setUser(data)
      if (data.householdId) {
        setJoinCode(data.joinCode)
        setInHousehold(true)
        fetchTasks()
        fetchMembers()
      }
    }
    load()
  }, [])

  const fetchTasks = async () => {
    const token = await SecureStore.getItemAsync('token')
    console.log('📤 Fetching tasks with token:', token)
  
    try {
      const res = await fetch(`${API_BASE}/api/task/mobile/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
  
      const data = await res.json()
      console.log('📥 Fetched task data:', data)
  
      setTasks(data.tasks || [])
    } catch (err) {
      console.error('❌ Error fetching tasks:', err)
    }
  }
  

  const fetchMembers = async () => {
    const token = await SecureStore.getItemAsync('token')
    console.log('📤 Fetching members with token:', token)
    const res = await fetch(`${API_BASE}/api/household/mobile-members`, {
        headers: { Authorization: `Bearer ${token}` },
      })      
    const data = await res.json()
    console.log('📥 Fetched members data:', data)
    setMembers(data.members || [])
  }

  const handleAddTask = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/task/mobile/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name: selectedTask,
        cycle,
        customDays: cycle === 'custom' ? parseFloat(customDays) : null,
      }),
    })
    if (res.ok) {
      fetchTasks()
      setSelectedTask('')
      setCycle('weekly')
      setCustomDays('')
      setShowCycleSelect(false)
    }
  }

  const markTaskDone = async (taskId: string) => {
    const token = await SecureStore.getItemAsync('token')
    await fetch(`${API_BASE}/api/task/mobile/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId }),
    })
    await fetch(`${API_BASE}/api/task/mobile/reassign`, { method: 'POST' })
    fetchTasks()
  }

  const deleteTask = async (taskId: string) => {
    const token = await SecureStore.getItemAsync('token')
    await fetch(`${API_BASE}/api/task/mobile/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId }),
    })
    fetchTasks()
  }
  const handleCreateHousehold = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/household/mobile-create`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (res.ok) {
      setJoinCode(data.joinCode)
      setInHousehold(true)
      fetchMembers()
      fetchTasks()
    } else {
      Alert.alert('Error', data.error || 'Could not create household')
    }
  }
  
  const handleJoinHousehold = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/household/mobile-join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ joinCode: inputCode.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      setJoinCode(data.joinCode)
      setInHousehold(true)
      setInputCode('')
      fetchMembers()
      fetchTasks()
    } else {
      Alert.alert('Error', data.error || 'Invalid join code')
    }
  }
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchTasks()
    await fetchMembers()
    setRefreshing(false)
  }
  
  const activeTasks = tasks.filter((t: any) => !t.completed && t.assignedTo?.email === user?.email)
  const completedTasks = tasks.filter((t: any) => t.completed && t.assignedTo?.email === user?.email)

  const timeUntil = (deadline: Date) => {
    const now = new Date()
    const ms = deadline.getTime() - now.getTime()
    const hours = Math.floor(ms / (1000 * 60 * 60))
    if (hours >= 24) return `${Math.floor(hours / 24)}d`
    return `${hours}h`
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFE600' }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={{ padding: 20 }}
      >
        {/* Header */}
        <Text style={styles.welcome}>👋 Welcome, {user?.name || 'Roomie'}</Text>

        <View style={styles.topRow}>
          <Text style={styles.mascot}>🐱</Text>

          <View style={styles.leaderboard}>
            <Text style={styles.leaderboardTitle}>Whose eating it</Text>
            {members.map((m, i) => (
              <View key={i} style={[styles.rankCard, i === 0 && styles.rankCardTop]}>
                <View style={styles.rankCircle}>
                  <Text style={styles.rankNumber}>{i + 1}</Text>
                </View>
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {m.name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.memberName}>{m.name === user?.name ? `${m.name} (You)` : m.name}</Text>
                <Text style={styles.points}>{m.points || 0} pts</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Tasks */}
        <Text style={styles.sectionTitle}>📋 Your Tasks</Text>
        {activeTasks.map((task) => {
          const assignedAt = new Date(task.assignedAt)
          const days =
            task.cycle === 'weekly'
              ? 7
              : task.cycle === 'biweekly'
              ? 14
              : task.cycle === 'monthly'
              ? 30
              : task.customDays || 1
          const deadline = new Date(assignedAt.getTime() + days * 24 * 60 * 60 * 1000)

          return (
            <View key={task._id} style={styles.taskCard}>
              <TouchableOpacity onPress={() => markTaskDone(task._id)}>
                <Text style={styles.action}>✅</Text>
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text style={styles.taskName}>{task.name}</Text>
                <Text style={styles.due}>Due in {timeUntil(deadline)}</Text>
              </View>

              <TouchableOpacity onPress={() => deleteTask(task._id)}>
                <Text style={styles.action}>🗑️</Text>
              </TouchableOpacity>
            </View>
          )
        })}

        {/* Completed */}
        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ Completed</Text>
            {completedTasks.map((task) => (
              <View key={task._id} style={[styles.taskCard, { opacity: 0.5 }]}>
                <Text style={[styles.taskName, { flex: 1 }]}>{task.name}</Text>
                <Text style={styles.due}>✔️</Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Footer Nav */}
      <View style={styles.footer}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.icon}>📸</Text>
        <Text style={[styles.icon, styles.activeIcon]}>🟡</Text>
        <Text style={styles.icon}>🏠</Text>
        <Text style={styles.icon}>⚙️</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  welcome: {
    fontSize: 26,
    color: '#000',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  mascot: {
    fontSize: 64,
  },
  leaderboard: {
    flex: 1,
  },
  leaderboardTitle: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  rankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rankCardTop: {
    backgroundColor: '#FFF7C0',
  },
  rankCircle: {
    backgroundColor: '#FFD700',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  initials: {
    backgroundColor: '#3ddc84',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    fontWeight: 'bold',
    color: '#fff',
  },
  memberName: {
    flex: 1,
    fontWeight: '600',
    color: '#333',
  },
  points: {
    fontWeight: 'bold',
    color: '#995300',
  },
  sectionTitle: {
    color: '#111',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  taskCard: {
    backgroundColor: '#FFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
  },
  taskName: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  due: {
    color: '#666',
    fontSize: 12,
  },
  action: {
    fontSize: 22,
    marginHorizontal: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 18,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#000',
  },
  icon: {
    color: '#fff',
    fontSize: 24,
  },
  activeIcon: {
    backgroundColor: '#FFE600',
    color: '#000',
    paddingHorizontal: 10,
    borderRadius: 20,
  },
})