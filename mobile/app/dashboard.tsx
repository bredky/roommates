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
  

  return (
    <ScrollView style={{ padding: 20, backgroundColor: '#1e1e2f', flex: 1 }} refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#fff" 
        />
      }>
      <Text style={styles.header}>👋 Hey {user?.name || 'roomie'}!</Text>
      {!inHousehold && (
        <View style={styles.card}>
            <Text style={styles.subHeader}>🧼 Join or Create a Household</Text>

            <Button title="🎉 Create Household" onPress={handleCreateHousehold} />

            <View style={{ flexDirection: 'row', marginTop: 10 }}>
            <TextInput
                placeholder="🔑 Enter join code"
                value={inputCode}
                onChangeText={setInputCode}
                style={styles.input}
            />
            <Button title="🚪 Join" onPress={handleJoinHousehold} disabled={!inputCode.trim()} />
            </View>
        </View>
        )}

      {inHousehold && (
        <View style={styles.card}>
          <Text>🏠 You're part of a household!</Text>
          <Text>🔐 Your join code: <Text style={{ fontWeight: 'bold' }}>{joinCode}</Text></Text>

          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>🧑‍🤝‍🧑 Members:</Text>
          {members.map((m, i) => (
            <Text key={i}>{m.name} ({m.email}) — {m.points || 0} pts {m.points >= 3 ? '⚠️' : ''}</Text>
          ))}
        </View>
      )}

      {inHousehold && (
        <View style={styles.card}>
          <Text style={styles.subHeader}>📝 Household Tasks</Text>
          {!showCycleSelect ? (
            <>
              <View style={styles.taskGrid}>
                {presetTasks.map((t, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.taskBtn}
                    onPress={() => {
                      setSelectedTask(t)
                      setShowCycleSelect(true)
                    }}>
                    <Text style={{ color: '#fff' }}>➕ {t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', marginTop: 10 }}>
                <TextInput
                  placeholder="✍️ Custom task..."
                  value={customTaskInput}
                  onChangeText={setCustomTaskInput}
                  style={styles.input}
                />
                <Button
                  title="Add"
                  onPress={() => {
                    setSelectedTask(customTaskInput)
                    setShowCycleSelect(true)
                  }}
                />
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text>🌀 How often should "{selectedTask}" repeat?</Text>
              <Picker
                selectedValue={cycle}
                onValueChange={(val) => setCycle(val)}
                style={{ backgroundColor: '#fff', marginBottom: 10 }}
                >
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Biweekly" value="biweekly" />
                <Picker.Item label="Monthly" value="monthly" />
                <Picker.Item label="Custom" value="custom" />
                <Picker.Item label="Indefinite" value="indefinite" />
              </Picker>
              {cycle === 'custom' && (
                <TextInput
                  placeholder="Enter # of days"
                  value={customDays}
                  onChangeText={setCustomDays}
                  keyboardType="numeric"
                  style={styles.input}
                />
              )}
              <Button
                title="✅ Add Task"
                onPress={handleAddTask}
                disabled={cycle === 'custom' && !customDays}
              />
              <Button
                title="❌ Cancel"
                onPress={() => {
                  setShowCycleSelect(false)
                  setSelectedTask('')
                  setCycle('weekly')
                  setCustomDays('')
                }}
              />
            </View>
          )}

          <Text style={{ marginTop: 10, fontWeight: 'bold' }}>📋 Current Tasks:</Text>
          {tasks.map((task) => {
            const assignedAt = new Date(task.assignedAt)
            const days = task.cycle === 'weekly' ? 7 : task.cycle === 'biweekly' ? 14 : task.cycle === 'monthly' ? 30 : task.customDays || 1
            const deadline = new Date(assignedAt.getTime() + days * 24 * 60 * 60 * 1000)
            const now = new Date()
            const isOverdue = !task.completed && now > deadline

            return (
              <View key={task._id} style={styles.taskCard}>
                <Text style={styles.taskTitle}>{task.name}</Text>
                <Text>👤 Assigned to: {task.assignedTo?.name || 'Unknown'}</Text>
                <Text>📅 Due: {deadline.toDateString()}</Text>
                <Text>
                  {task.completed ? '✅ Completed' : isOverdue ? '⚠️ Overdue' : '🕒 In Progress'}
                </Text>
                {!task.completed && task.assignedTo?.email === user?.email && (
                  <Button title="✅ Done" onPress={() => markTaskDone(task._id)} />
                )}
                <Button title="❌ Remove" color="red" onPress={() => deleteTask(task._id)} />
              </View>
            )
          })}
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    color: 'white',
    marginBottom: 10,
  },
  subHeader: {
    fontSize: 18,
    color: 'white',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#2e2e40',
    padding: 16,
    borderRadius: 10,
    marginTop: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 6,
    marginBottom: 10,
    flex: 1,
  },
  taskBtn: {
    backgroundColor: '#3d3d5c',
    padding: 8,
    borderRadius: 6,
  },
  taskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  taskCard: {
    backgroundColor: '#3a3a55',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    color: 'white',
  },
})
