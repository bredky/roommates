import React, { useEffect, useState } from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

export default function VoteRespond() {
  const { voteId } = useLocalSearchParams()
  const router = useRouter()

  const [vote, setVote] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        <ActivityIndicator size="large" color="#000" />
      </View>
    )
  }
  console.log('🧍 user._id:', user?._id, '| typeof:', typeof user?._id)
  console.log('📣 vote.reporterId:', vote?.reporterId, '| typeof:', typeof vote?.reporterId)
  
  console.log('🔁 user._id.toString():', user?._id?.toString?.())
  console.log('🔁 vote.reporterId.toString():', vote?.reporterId?.toString?.())
  
  const isReporter =
    user?._id?.toString?.() === vote?.reporterId?.toString?.()
  console.log('✅ isReporter:', isReporter)
  
  console.log('👥 vote.voters:', vote?.voters)
  console.log('🧍 user._id (again):', user?._id)
  
  const alreadyVoted = vote?.voters?.some(
    (v: any) => v?.toString?.() === user?._id?.toString?.()
  )
  console.log('✅ alreadyVoted:', alreadyVoted)
  
  const reporter = members.find((m) => m._id === vote.reporterId)
  const target = members.find((m) => m._id === vote.reportedUserId)



  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Vote on this report</Text>
      <Image source={{ uri: vote.imageUri }} style={styles.image} />

      <View style={styles.block}>
        <Text style={styles.label}>Reported by: <Text style={styles.highlight}>{reporter?.name}</Text></Text>
        <Text style={styles.label}>Targeted: <Text style={styles.highlight}>{target?.name}</Text></Text>
        <Text style={styles.desc}>{vote.description}</Text>
      </View>

      {user._id === vote.reporterId ? (
  <View style={styles.block}>
    <Text style={styles.label}>
      You created this report. Your vote for <Text style={styles.yesText}>POINTTTSSSS</Text> has already been counted.
    </Text>
  </View>
) : vote.voters.includes(user._id.toString()) ? (
  <View style={styles.block}>
    <Text style={styles.label}>You have already voted on this report.</Text>
  </View>
) : (
  <View style={styles.buttonRow}>
    <TouchableOpacity style={styles.yesBtn} onPress={() => handleVote('yes')}>
      <Text style={styles.btnText}>POINTTTSSSS</Text>
    </TouchableOpacity>
    <TouchableOpacity style={styles.noBtn} onPress={() => handleVote('no')}>
      <Text style={styles.btnText}>nah they good</Text>
    </TouchableOpacity>
  </View>
)}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#FFE600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 12, color: '#000' },
  image: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
    borderRadius: 12,
    marginBottom: 16,
    borderColor: '#000',
    borderWidth: 3,
  },
  yesText: {
    color: '#FFE600',
    fontWeight: 'bold',
  },
  
  block: {
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },
  label: {
    color: '#FFE600',
    fontWeight: '600',
    marginBottom: 4,
  },
  highlight: {
    color: '#fff',
    fontWeight: '800',
  },
  desc: {
    color: '#ccc',
    marginTop: 8,
    fontStyle: 'italic',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  yesBtn: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  noBtn: {
    backgroundColor: '#000',
    padding: 14,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  btnText: {
    color: '#FFE600',
    fontWeight: '700',
  },
})
