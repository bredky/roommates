// /report/preview.tsx

import React, { useState, useEffect } from 'react'
import { View, Image, StyleSheet, TouchableOpacity, Text } from 'react-native'
import { useRouter, useLocalSearchParams } from 'expo-router'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as SecureStore from 'expo-secure-store'

import TargetedVoteModal from '../../components/TargetedVoteModal'

const API_BASE = 'http://192.168.1.208:3000'

export default function PreviewScreen() {
    const [user, setUser] = useState<any>(null)
    const router = useRouter()
    const [members, setMembers] = useState<any[]>([])
    const [showTargetedModal, setShowTargetedModal] = useState(false)
    const insets = useSafeAreaInsets()
    const imageUri = useLocalSearchParams().imageUri
    useEffect(() => {
      const load = async () => {
        const token = await SecureStore.getItemAsync('token')
    
        const [userRes, membersRes] = await Promise.all([
          fetch(`${API_BASE}/api/user/mobile-me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE}/api/household/mobile-members`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])
    
        const userData = await userRes.json()
        const membersData = await membersRes.json()
        console.log('hello')
        console.log('🧍 Logged-in User:', userData)
        console.log('👥 Members Fetched:', membersData)
        setUser(userData)
        setMembers(membersData.members || [])
      }
    
      load()
    }, [])
    
    {
      showTargetedModal && user && members.length > 0 && (
        <TargetedVoteModal
          visible={showTargetedModal}
          onClose={() => setShowTargetedModal(false)}
          imageUri={imageUri as string}
          members={members}
          currentUser={user}
          router={router}
        />
      )
    }
    

  return (
    <View style={{ flex: 1, backgroundColor: '#FFE600' }}>
      <SafeAreaView style={[styles.container]}>
        {/* Cancel / Retake */}
        <View style={[styles.topRow, { marginTop: insets.top - 30 }]}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => {
              router.back()
              setTimeout(() => router.back(), 20)
            }}
          >
            <Text style={styles.cancelText}>✖️ Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.topButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelText}>🔁 Retake</Text>
          </TouchableOpacity>
        </View>

        {/* Image */}
        <View style={styles.imageWrapper}>
          {typeof imageUri === 'string' && (
            <Image source={{ uri: imageUri }} style={styles.image} />
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setShowTargetedModal(true)}
          >
            <Text style={styles.buttonText}>🎯 Targeted Vote</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>🗳️ Open Vote</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.icon}>🔍</Text>
        <Text style={[styles.icon, styles.activeIcon]}>📸</Text>
        <Text style={styles.icon} onPress={() => router.push('/dashboard')}>🟡</Text>
        <Text style={styles.icon} onPress={() => router.push('/household')}>🏠</Text>
        <Text style={styles.icon}>⚙️</Text>
      </View>

      {/* Targeted Vote Modal */}
      {imageUri && (
        <TargetedVoteModal
          visible={showTargetedModal}
          onClose={() => setShowTargetedModal(false)}
          imageUri={imageUri as string}
          members={members}
          currentUser={user}
          router={router}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFEB3B',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  topButton: {
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  cancelText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageWrapper: {
    flex: 1,
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 4,
    borderColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buttonSection: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  button: {
    backgroundColor: '#000',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginVertical: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
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
})
