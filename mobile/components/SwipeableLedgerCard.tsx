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

export default function SwipeableLedgerCard({ entry, onConfirm }) {
  const translateX = useSharedValue(0)
  const [active, setActive] = useState(false)

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX
    },
    onEnd: () => {
      if (translateX.value > SWIPE_THRESHOLD) {
        translateX.value = withTiming(ACTION_OFFSET)
        runOnJS(setActive)(true)
      } else {
        translateX.value = withTiming(0)
        runOnJS(setActive)(false)
      }
    },
  })

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    }
  })

  return (
    <View style={styles.outer}>
      {/* Confirm Pay Action */}
      <View style={styles.leftAction}>
        <TouchableOpacity
          disabled={!active}
          onPress={() => {
            console.log('✅ Paid:', entry.name)
            onConfirm(entry.id)
          }}
          style={[styles.actionButton, { opacity: active ? 1 : 0.3 }]}
        >
          <Text style={styles.actionText}>✅</Text>
        </TouchableOpacity>
      </View>

      {/* Main Ledger Card */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.card, animatedStyle]}>
          <Text style={styles.name}>Pay {entry.name}</Text>
          <Text style={styles.amount}>${entry.amount}</Text>
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
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    zIndex: 2,
  },
  leftAction: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: ACTION_OFFSET,
    backgroundColor: '#C4F0B7',
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
  name: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000',
  },
  amount: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
})
