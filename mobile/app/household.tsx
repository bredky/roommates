import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import AddTaskModal from '../components/AddTaskModal'

import SwipeableTaskCard from '../components/SwipeableTaskCard'
import SwipeableCompletedTaskCard from '../components/SwipeableCompletedTaskCard'
import NonOwnedTaskCard from '../components/NonOwnedTaskCard'
import ActivityLogItem from '../components/ActivityLogItem'

const API_BASE = 'http://192.168.1.208:3000'

export default function Household() {
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [activityLog, setActivityLog] = useState<any[]>([])
  const [openVotes, setOpenVotes] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)

  const router = useRouter()

  const fetchUserData = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/user/mobile-me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setUser(data)
  }

  const fetchMembers = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/household/mobile-members`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setMembers(data.members || [])
  }

  const fetchTasks = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/task/mobile/get`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setTasks(data.tasks || [])
  }

  const fetchActivity = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/activity/mobile-feed`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setActivityLog(data.activityLog || [])
  }

  const fetchVotes = async () => {
    const token = await SecureStore.getItemAsync('token')
    const res = await fetch(`${API_BASE}/api/vote/mobile-get`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    setOpenVotes(data.votes || [])
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchUserData()
    await fetchMembers()
    await fetchTasks()
    await fetchActivity()
    await fetchVotes()
    setRefreshing(false)
  }

  useEffect(() => {
    handleRefresh()
  }, [])

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

  const handleAddTask = async ({ name, cycle, customDays }: any) => {
    const token = await SecureStore.getItemAsync('token')

    await fetch(`${API_BASE}/api/task/mobile/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        cycle,
        customDays: cycle === 'custom' ? customDays : null,
      }),
    })

    await fetch(`${API_BASE}/api/activity/mobile-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'taskCreated',
        taskName: name,
        timestamp: new Date().toISOString(),
      }),
    })

    fetchTasks()
    fetchActivity()
  }

  const userTasks = tasks.filter((t) => !t.completed && t.assignedTo?.email === user?.email)
  const othersTasks = tasks.filter((t) => !t.completed && t.assignedTo?.email !== user?.email)
  const completedTasks = tasks.filter((t) => t.completed)

  return (
    <View style={{ flex: 1, backgroundColor: '#FFE600' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ padding: 20 }}
        >
          <Text style={styles.sticker}>🏷️ Code: {user?.joinCode}</Text>

          {/* Leaderboard */}
          <View style={styles.leaderboardRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionTitle}>🏆 Leaderboard</Text>
              {members.map((m, i) => (
                <View key={i} style={[styles.rankCard, i === 0 && styles.rankCardTop]}>
                  <View style={styles.rankCircle}>
                    <Text style={styles.rankNumber}>{i + 1}</Text>
                  </View>
                  <View style={styles.initials}>
                    <Text style={styles.initialsText}>
                      {m.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.memberName}>
                    {m.name === user?.name ? `${m.name} (You)` : m.name}
                  </Text>
                  <Text style={styles.points}>{m.points || 0} pts</Text>
                </View>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonStack}>
              <TouchableOpacity onPress={() => setShowAddTaskModal(true)} style={styles.actionButton}>
                <Text style={styles.buttonText}>➕ Add Task</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => alert('🚨 Report feature coming soon!')} style={styles.actionButton}>
                <Text style={styles.buttonText}>🚨 Report</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/ledger')} style={styles.actionButton}>
                <Text style={styles.buttonText}>📒 Ledger</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* OPEN VOTE BLOCK */}
          {openVotes.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🗳️ Open Vote</Text>
              {openVotes.map((vote, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.voteBlock}
                  onPress={() => {
                      router.push({ pathname: '/vote/respond', params: { voteId: vote._id.toString() } })
                    
                  }}
                >
                  <Text style={styles.voteLabel}>Report from {members.find(m => m._id === vote.reporterId)?.name}</Text>
                  <Text style={styles.voteTarget}>Blaming: {members.find(m => m._id === vote.reportedUserId)?.name}</Text>
                  <Text style={styles.voteDescription}>{vote.description}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Activity Feed */}
          <Text style={styles.sectionTitle}>📜 Household Activity</Text>
          <View style={styles.activityBlock}>
            <ScrollView style={styles.activityScroll}>
              {activityLog.map((entry, index) => (
                <ActivityLogItem key={index} activity={entry} />
              ))}
            </ScrollView>
          </View>

          {/* Tasks */}
          <Text style={styles.sectionTitle}>🧽 Tasks</Text>
          {userTasks.map((task) => (
            <SwipeableTaskCard key={task._id} task={task} onComplete={() => markTaskDone(task)} onDelete={() => deleteTask(task)} />
          ))}
          {othersTasks.map((task) => (
            <NonOwnedTaskCard key={task._id} task={task} onDelete={() => deleteTask(task)} />
          ))}

          {/* Completed */}
          <Text style={styles.sectionTitle}>✅ Completed</Text>
          {completedTasks.map((task) => (
            <SwipeableCompletedTaskCard key={task._id} task={task} onDelete={() => deleteTask(task)} />
          ))}
        </ScrollView>
      </SafeAreaView>

      <View style={styles.footer}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={styles.icon} onPress={() => router.push('/report/camera')}>📸</Text>
        <Text style={styles.icon} onPress={() => router.push('/dashboard')}>🟡</Text>
        <Text style={[styles.icon, styles.activeIcon]}>🏠</Text>
        <Text style={styles.icon} onPress={() => router.push('/logout')}>⚙️</Text>
      </View>

      <AddTaskModal
        visible={showAddTaskModal}
        onClose={() => setShowAddTaskModal(false)}
        onSubmit={handleAddTask}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  sticker: {
    backgroundColor: '#000',
    color: '#FFE600',
    padding: 6,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginVertical: 12,
    color: '#111',
  },
  rankCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginBottom: 10,
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
    color: '#fff',
    fontWeight: 'bold',
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
  activityBlock: {
    backgroundColor: '#FFF58B',
    borderRadius: 12,
    maxHeight: 200,
    padding: 10,
    marginBottom: 16,
  },
  activityScroll: {
    maxHeight: 180,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
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
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // ⬅️ centers buttons vertically
    marginBottom: 20,
  },
  buttonStack: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFE600',
    fontWeight: '600',
  },
  voteBlock: {
    backgroundColor: '#000',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  voteLabel: {
    color: '#FFE600',
    fontWeight: '600',
    marginBottom: 4,
  },
  voteTarget: {
    color: '#fff',
    fontWeight: '500',
    marginBottom: 4,
  },
  voteDescription: {
    color: '#ccc',
    fontStyle: 'italic',
  },
  
})
