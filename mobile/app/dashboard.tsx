// /mobile/app/dashboard.tsx

import { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { RefreshControl } from 'react-native'
import SwipeableTaskCard from '../components/SwipeableTaskCard' // adjust path if needed
import SwipeableCompletedTaskCard from '../components/SwipeableCompletedTaskCard'
import { useRouter } from 'expo-router'
import { generateInitialsStable } from '../../lib/utils'



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
import { SafeAreaView } from 'react-native-safe-area-context'

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
  const router = useRouter()
  const nameList = members.map((m) => m.name)
  const initialsMap = generateInitialsStable(nameList)

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
  
    try {
      const res = await fetch(`${API_BASE}/api/task/mobile/get`, {
        headers: { Authorization: `Bearer ${token}` },
      })
  
      const data = await res.json()
  
      setTasks(data.tasks || [])
    } catch (err) {
    }
  }
  

  const fetchMembers = async () => {
    const token = await SecureStore.getItemAsync('token')
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
    await fetch(`${API_BASE}/api/activity/mobile-log`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: 'taskCreated',
          taskName: selectedTask,
          timestamp: new Date().toISOString(),
        }),
      })
  }

  const markTaskDone = async (task: any) => {
    const token = await SecureStore.getItemAsync('token')
    await fetch(`${API_BASE}/api/task/mobile/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId: task._id }),
    })
  
    await fetch(`${API_BASE}/api/task/mobile/reassign`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  
    await fetch(`${API_BASE}/api/activity/mobile-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'taskCompleted',
        taskName: task.name,
        timestamp: new Date().toISOString(),
      }),
    })
  
    fetchTasks()
  }
  

  const deleteTask = async (task: any) => {
    const token = await SecureStore.getItemAsync('token')
    await fetch(`${API_BASE}/api/task/mobile/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ taskId: task._id }),
    })
  
    await fetch(`${API_BASE}/api/activity/mobile-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'taskDeleted',
        taskName: task.name,
        deletedBy: user?.name,
        timestamp: new Date().toISOString(),
      }),
    })
  
    fetchTasks()
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFE600' }}>
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
                    {initialsMap[m.name] || m.name.slice(0, 2).toUpperCase()}
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
        {activeTasks.map((task) => (
            <SwipeableTaskCard
                key={task._id}
                task={task}
                onComplete={(id) => markTaskDone(task)}
                onDelete={(id) => deleteTask(task)}
            />
            ))}


        {/* Completed */}
        {completedTasks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>✅ Completed</Text>
            {completedTasks.map((task) => (
              <SwipeableCompletedTaskCard
              key={task._id}
              task={task}
              onDelete={(id) => deleteTask(task)}
            />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
    {/* Footer Nav */}
      <View style={styles.footer}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.icon}>📸</Text>
        <Text style={[styles.icon, styles.activeIcon]}>🟡</Text>
        <Text style={styles.icon} onPress={() => router.push('/household')}>🏠</Text>
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
    alignItems: 'flex-start', // ⬅️ anchor icons to the top of the footer
    paddingTop: 10,
    paddingBottom: 50,
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