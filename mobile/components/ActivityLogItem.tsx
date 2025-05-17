import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

export default function ActivityLogItem({ activity }) {
  const { user, type, taskName, points, timestamp, deletedBy } = activity

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const ms = now.getTime() - date.getTime()
    const minutes = Math.floor(ms / (1000 * 60))
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  let message = ''
  switch (type) {
    case 'taskCompleted':
      message = `${user.name} completed ‘${taskName}’`
      break
    case 'taskDeleted':
      message = `‘${taskName}’ was deleted by ${deletedBy}`
      break
    case 'pointGiven':
      message = `${user.name} received ${points} point${points === 1 ? '' : 's'} for missing ‘${taskName}’`
      break
    case 'taskCreated':
      message = `${user.name} added a new task: ‘${taskName}’`
      break
    case 'taskReassigned':
      message = `‘${taskName}’ was reassigned to ${user.name}`
      break
    default:
      message = 'Unknown activity'
  }

  return (
    <View style={styles.container}>
      <View style={styles.initialsBubble}>
        <Text style={styles.initialsText}>{initials}</Text>
      </View>
      <View style={styles.messageBlock}>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.timestamp}>{timeAgo(timestamp)}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFF8B0',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: 'center',
  },
  initialsBubble: {
    backgroundColor: '#000',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  initialsText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  messageBlock: {
    flex: 1,
  },
  message: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
})
