import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'

const API_BASE = 'http://192.168.1.208:3000'

export default function VoteRespond() {
  const { voteId } = useLocalSearchParams()
  const router = useRouter()

  const [vote, setVote] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [imageLoaded, setImageLoaded] = useState(false)


  useEffect(() => {
    handleFetch()
  }, [])

  const handleFetch = async () => {
    const token = await SecureStore.getItemAsync('token')

    const [userRes, membersRes, voteRes] = await Promise.all([
      fetch(`${API_BASE}/api/user/mobile-me`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/api/household/mobile-members`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${API_BASE}/api/vote/mobile-single?voteId=${voteId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])

    const userData = await userRes.json()
    const membersData = await membersRes.json()
    const voteData = await voteRes.json()

    setUser(userData)
    setMembers(membersData.members)
    setVote(voteData.vote)
    setLoading(false)
  }

  const handleVote = async (decision: 'yes' | 'no') => {
    const token = await SecureStore.getItemAsync('token')

    const res = await fetch(`${API_BASE}/api/vote/mobile-cast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        voteId,
        decision,
      }),
    })

    const result = await res.json()

    if (res.ok) {
      Alert.alert('Vote submitted!', 'Your vote has been recorded.')
      router.push('/household')
    } else {
      Alert.alert('Error', result.error || 'Something went wrong.')
    }
  }

  if (loading || !vote || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF4D4D" />
      </View>
    )
  }

  const isReporter = user?._id?.toString?.() === vote?.reporterId?.toString?.()
  const alreadyVoted = vote?.voters?.some(
    (v: any) => v?.toString?.() === user?._id?.toString?.()
  )

  const reporter = members.find((m) => m._id === vote.reporterId)
  const target = members.find((m) => m._id === vote.reportedUserId)

  
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
  <Text style={styles.backIcon}>←</Text>
</TouchableOpacity>

      <Animated.Text entering={FadeInDown.springify()} style={styles.title}>
        🗳️ Vote on this report
      </Animated.Text>

      <Animated.View
        style={styles.imageWrapper}
        entering={FadeInDown.delay(100).springify()}
      >
        <Image
  source={{ uri: vote.imageUri }}
  style={styles.image}
  onLoadEnd={() => setImageLoaded(true)}
/>
      </Animated.View>

      <Animated.View
        style={styles.block}
        entering={FadeInDown.delay(200).springify()}
      >
        <Text style={styles.label}>
          Reported by <Text style={styles.highlight}>{reporter?.name}</Text>
        </Text>
        <Text style={styles.label}>
          Targeted <Text style={styles.highlight}>{target?.name}</Text>
        </Text>
        <Text style={styles.desc}>“{vote.description}”</Text>
      </Animated.View>

      {isReporter ? (
        <Animated.View
          style={styles.infoCard}
          entering={FadeInDown.delay(300).springify()}
        >
          <Text style={styles.infoText}>
            ✅ You created this report. Your vote for{' '}
            <Text style={styles.yesText}>POINTTTSSSS</Text> has been auto-recorded.
          </Text>
        </Animated.View>
      ) : alreadyVoted ? (
        <Animated.View
          style={styles.infoCard}
          entering={FadeInDown.delay(300).springify()}
        >
          <Text style={styles.infoText}>🗂️ You've already voted on this report.</Text>
        </Animated.View>
      ) : (
        <Animated.View
          style={styles.buttonRow}
          entering={FadeInDown.delay(300).springify()}
        >
          <TouchableOpacity style={styles.yesBtn} onPress={() => handleVote('yes')}>
            <Text style={styles.btnText}>✅ POINTTTSSSS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.noBtn} onPress={() => handleVote('no')}>
            <Text style={styles.btnText}>🚫 nah they good</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  )
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#1a1a1a',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  title: {
    fontWeight: 'bold',
    fontSize: 22,
    color: '#FF4D4D',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    marginHorizontal: 20,
    aspectRatio: 3 / 4,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF4D4D',
    overflow: 'hidden',
    marginBottom: 24,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  block: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  label: {
    color: '#FF4D4D',
    fontWeight: '600',
    fontSize: 14,
    marginBottom: 6,
  },
  highlight: {
    color: '#fff',
    fontWeight: '800',
  },
  desc: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  infoCard: {
    marginHorizontal: 20,
    backgroundColor: '#222',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4D4D',
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  yesText: {
    color: '#FF4D4D',
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  yesBtn: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  noBtn: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontWeight: '700',
    fontSize: 15,
    color: '#000',
  },
  backButton: {
  position: 'absolute',
  top: 20,
  left: 20,
  zIndex: 10,
  backgroundColor: '#000',
  borderRadius: 8,
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderWidth: 2,
  borderColor: '#FF4D4D',
},
backIcon: {
  color: '#FF4D4D',
  fontSize: 18,
  fontWeight: '700',
},

})
