import React, { useState, useEffect } from 'react'

import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import * as SecureStore from 'expo-secure-store'

const API_BASE = 'http://192.168.1.208:3000'

export default function TargetedVoteModal({
  visible,
  onClose,
  imageUri,
  members,
  currentUser,
  router,
}: {
  visible: boolean
  onClose: () => void
  imageUri: string
  members: any[]
  currentUser: any
  router: any
}) {

    useEffect(() => {
        console.log('🟨 Modal Mounted with Props:')
        console.log('👤 Current User:', currentUser)
        console.log('👥 Members in Modal:', members)
      }, [members, currentUser])
        
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [delay, setDelay] = useState<number>(0)
  const [customDelay, setCustomDelay] = useState('')
  const [description, setDescription] = useState('')

  const delayOptions = [0, 8, 16, 24]
  
  const uploadImage = async (uri: string) => {
    const token = await SecureStore.getItemAsync('token')
    console.log('🗝️ Token:', token)
    const formData = new FormData()
    formData.append('file', {
      uri,
      name: 'photo.jpg',
      type: 'image/jpeg',
    } as any)
    console.log('Uploading image to:', `${API_BASE}/api/upload-image`)

    const res = await fetch(`${API_BASE}/api/upload-image`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`, // do NOT set Content-Type manually!
      },
      body: formData,
    })
  
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Upload failed')
    return data.url
  }
  
  const handleSubmit = async () => {
    try {
      if (!selectedUser) {
        alert('Please select a user who caused the mess.')
        return
      }
  
      if (!description.trim()) {
        alert('Please enter a description.')
        return
      }
  
      // 1. Upload image and get public URL
      const publicImageUrl = await uploadImage(imageUri)
  
      // 2. Submit targeted vote with public image URL
      const token = await SecureStore.getItemAsync('token')
      const delayHours = delay === -1 ? parseInt(customDelay) || 0 : delay
  
      await fetch(`${API_BASE}/api/vote/targeted-create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          imageUri: publicImageUrl,
          reportedUserId: selectedUser._id,
          delayHours,
          description,
        }),
      })
  
      onClose()
      router.push('/household')
    } catch (error: any) {
      alert(error.message || 'Something went wrong during upload.')
    }
  }
  

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Targeted Vote</Text>

            <Text style={styles.label}>Who caused the mess?</Text>
            <View style={styles.optionsContainer}>
              {members
                .filter((m) => m._id?.toString() !== currentUser?._id?.toString())
                .map((m) => (
                  <TouchableOpacity
                    key={m._id}
                    style={[
                      styles.memberOption,
                      selectedUser?._id === m._id && styles.memberSelected,
                    ]}
                    onPress={() => setSelectedUser(m)}
                  >
                    <Text style={styles.optionText}>{m.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.label}>How long before they get a point?</Text>
            <View style={styles.optionsContainer}>
              {delayOptions.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.delayOption, delay === d && styles.delaySelected]}
                  onPress={() => setDelay(d)}
                >
                  <Text style={styles.optionText}>{d} hours</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.delayOption, delay === -1 && styles.delaySelected]}
                onPress={() => setDelay(-1)}
              >
                <Text style={styles.optionText}>Custom</Text>
              </TouchableOpacity>
            </View>

            {delay === -1 && (
              <TextInput
                placeholder="Enter custom delay (in hours)"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={customDelay}
                onChangeText={setCustomDelay}
                style={styles.input}
              />
            )}

            <Text style={styles.label}>Description</Text>
            <TextInput
              placeholder="Explain what happened..."
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={!selectedUser || description.trim() === ''}
            >
              <Text style={styles.submitText}>Submit Report</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  modalContainer: {
    backgroundColor: '#FFE600',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  scrollContent: {
    paddingBottom: 50,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 16,
    color: '#000',
  },
  label: {
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#000',
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  memberOption: {
    backgroundColor: '#000',
    padding: 10,
    borderRadius: 8,
  },
  memberSelected: {
    backgroundColor: '#333',
  },
  delayOption: {
    backgroundColor: '#000',
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  delaySelected: {
    backgroundColor: '#333',
  },
  optionText: {
    color: '#FFE600',
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    color: '#000',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#000',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  submitText: {
    color: '#FFE600',
    fontWeight: 'bold',
  },
  cancelButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  cancelText: {
    color: '#000',
    fontWeight: '600',
  },
})
