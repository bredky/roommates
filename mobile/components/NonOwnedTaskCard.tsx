import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { PanGestureHandler } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated'

const SCREEN_WIDTH = Dimensions.get('window').width
const ACTION_OFFSET = 80
const SWIPE_THRESHOLD = 50

export default function NonOwnedTaskCard({ task, onDelete }) {
  const translateX = useSharedValue(0)
  const [activeAction, setActiveAction] = useState<'delete' | null>(null)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX
    },
    onEnd: () => {
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withTiming(-ACTION_OFFSET)
        runOnJS(setActiveAction)('delete')
      } else {
        translateX.value = withTiming(0)
        runOnJS(setActiveAction)(null)
      }
    },
  })

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

  const timeUntil = () => {
    const now = new Date()
    const ms = deadline.getTime() - now.getTime()
    const hours = Math.floor(ms / (1000 * 60 * 60))
    if (hours >= 24) return `${Math.floor(hours / 24)}d`
    return `${hours}h`
  }

  const initials = task.assignedTo?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  return (
    <View style={styles.outer}>
      {/* Right Action (Delete Only) */}
      <View style={styles.rightAction}>
        <TouchableOpacity
          disabled={activeAction !== 'delete'}
          onPress={() => {
            console.log('❌ Delete pressed for:', task.name)
            onDelete(task._id)
          }}
          style={[
            styles.actionButton,
            { opacity: activeAction === 'delete' ? 1 : 0.3 },
          ]}
        >
          <Text style={styles.actionText}>❌</Text>
        </TouchableOpacity>
      </View>

      {/* Task Card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <View style={styles.row}>
            <View style={styles.initialsBubble}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{task.name}</Text>
              <Text style={styles.due}>Due in {timeUntil()}</Text>
            </View>
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  )
}

const styles = StyleSheet.create({
  outer: {
    position: 'relative',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 10,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  initialsBubble: {
    backgroundColor: '#000',
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
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  due: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
  rightAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_OFFSET,
    backgroundColor: '#FFD6D6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
    zIndex: 1,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  actionText: {
    fontSize: 22,
  },
})
