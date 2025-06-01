
import { useEffect, useState } from 'react'
import { Picker } from '@react-native-picker/picker'
import { RefreshControl } from 'react-native'
import SwipeableTaskCard from '../components/SwipeableTaskCard'
import SwipeableCompletedTaskCard from '../components/SwipeableCompletedTaskCard'
import { useRouter } from 'expo-router'
import { generateInitialsStable } from '../lib/utils'
import { useAppStore } from '../lib/UseAppStore'
import LoadingScreen from '../components/LoadingScreen'
import { useTaskStore } from '../lib/UseTaskStore'
import { useUserStore } from '../lib/useUserStore'
import { useMemberStore } from '../lib/useMemberStore'
import {
  View,
  Text,
  TextInput,
  Alert,
  ScrollView,
  StyleSheet,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import { useCallback } from 'react'

const API_BASE = 'http://192.168.1.208:3000'

export default function Dashboard() {
  const {
    user,
    fetchUser,
    checkForUpdates: checkUserUpdates,
    loading: userLoading,
  } = useUserStore()
  const [joinCode, setJoinCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [inHousehold, setInHousehold] = useState(false)
  const {
    members,
    fetchMembers,
    checkForUpdates: checkMemberUpdates,
    loading: memberLoading,
  } = useMemberStore()
  const [selectedTask, setSelectedTask] = useState('')
  const [cycle, setCycle] = useState('weekly')
  const [customDays, setCustomDays] = useState('')
  const [showCycleSelect, setShowCycleSelect] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initialLoadComplete, setInitialLoadComplete] = useState(false)
  const router = useRouter()
  const nameList = members.map((m) => m.name)
  const initialsMap = generateInitialsStable(nameList)
  const {
    tasks,
    fetchTasks,
    checkForUpdates,
    loading: taskLoading,
  } = useTaskStore()

  useEffect(() => {
  const load = async () => {
    setLoading(true)
    await fetchUser()             // Wait for it to complete
    const latestUser = useUserStore.getState().user  // Get updated user

    if (latestUser?.householdId) {
      setJoinCode(latestUser.joinCode)
      setInHousehold(true)

      const token = await SecureStore.getItemAsync('token')
      await fetch(`${API_BASE}/api/household/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })

      await Promise.all([
        fetchTasks(),            // ✅ Always fetch on first load
        fetchMembers()
      ])
    }

    setLoading(false)
    setInitialLoadComplete(true)
  }

  load()

  const interval = setInterval(() => {
    checkUserUpdates()
    checkMemberUpdates()
    checkForUpdates()
  }, 30000)

  return () => clearInterval(interval)
}, [])

useFocusEffect(
  useCallback(() => {
    fetchUser()
    fetchTasks()
    fetchMembers()
  }, [])
)

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
      await fetchTasks()
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

  const markTaskDone = async (task) => {
    const token = await SecureStore.getItemAsync('token')
    useTaskStore.getState().completeTask(task._id)

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
      headers: { Authorization: `Bearer ${token}` },
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
  }

  const deleteTask = async (task) => {
    const token = await SecureStore.getItemAsync('token')
    useTaskStore.getState().removeTask(task._id)

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
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchTasks(), fetchMembers()])
    setRefreshing(false)
  }

  const activeTasks = tasks.filter(
    (t) => !t.completed && t.assignedTo?.email === user?.email
  )
  const completedTasks = tasks.filter(
    (t) => t.completed && t.assignedTo?.email === user?.email
  )

  if (!initialLoadComplete) return <LoadingScreen />
  return (
    <View style={{ flex: 1, backgroundColor: '#FFE600' }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFE600' }}>
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={{ padding: 20 }}
        >
          <Text style={styles.welcome}>👋 Welcome, {user?.name || 'Roomie'}</Text>

          <View style={styles.topRow}>
            <Text style={styles.mascot}>🐱</Text>

            <View style={styles.leaderboard}>
              <Text style={styles.leaderboardTitle}>Whose eating it</Text>
              {members.map((m, i) => (
                <View
                  key={i}
                  style={[styles.rankCard, i === 0 && styles.rankCardTop]}
                >
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankNumber}>{i + 1}</Text>
                  </View>
                  <View style={styles.initials}>
                    <Text style={styles.initialsText}>
                      {initialsMap[m.name] || m.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>
                    {m.name === user?.name ? `${m.name} (You)` : m.name}
                  </Text>
                  <Text style={styles.points}>{m.points || 0} pts</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.sectionTitle}>📋 Your Tasks</Text>
          {activeTasks.map((task) => (
            <SwipeableTaskCard
              key={task._id}
              task={task}
              onComplete={() => markTaskDone(task)}
              onDelete={() => deleteTask(task)}
            />
          ))}

          {completedTasks.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Completed</Text>
              {completedTasks.map((task) => (
                <SwipeableCompletedTaskCard
                  key={task._id}
                  task={task}
                  onDelete={() => deleteTask(task)}
                />
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        <Text style={styles.icon}>🔍</Text>
        <Text
          style={styles.icon}
          onPress={() => router.push('/report/camera')}
        >
          📸
        </Text>
        <Text style={[styles.icon, styles.activeIcon]}>🟡</Text>
        <Text style={styles.icon} onPress={() => router.push('/household')}>
          🏠
        </Text>
        <Text style={styles.icon} onPress={() => router.push('/logout')}>
          ⚙️
        </Text>
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