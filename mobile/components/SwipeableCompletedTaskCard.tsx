import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3

export default function SwipeableCompletedTaskCard({ task, onDelete }) {
  const translateX = useSharedValue(0)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX
    },
    onEnd: () => {
      if (translateX.value > SWIPE_THRESHOLD) {
        runOnJS(onDelete)(task._id)
      } else {
        translateX.value = withTiming(0)
      }
    },
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
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
  const nextRotation = new Date(assignedAt.getTime() + days * 24 * 60 * 60 * 1000)

  const timeUntil = () => {
    const now = new Date()
    const ms = nextRotation.getTime() - now.getTime()
    const hours = Math.floor(ms / (1000 * 60 * 60))
    if (hours >= 24) return `${Math.floor(hours / 24)}d`
    return `${hours}h`
  }

  return (
    <View style={styles.outer}>
      <View style={styles.rightAction}>
        <Text style={styles.actionText}>🗑️</Text>
      </View>

      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.name}>{task.name}</Text>
          <Text style={styles.due}>Next rotation in {timeUntil()}</Text>
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
    backgroundColor: '#d8d8d8',
    padding: 16,
    borderRadius: 10,
    zIndex: 2,
  },
  rightAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#FFD6D6',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    borderRadius: 10,
  },
  actionText: {
    fontSize: 22,
  },
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#222',
  },
  due: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
})
