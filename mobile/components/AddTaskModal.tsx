import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native'
import { KeyboardAvoidingView, Platform } from 'react-native'


const SCREEN_HEIGHT = Dimensions.get('window').height

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

export default function AddTaskModal({ visible, onClose, onSubmit }) {
  const [selectedTask, setSelectedTask] = useState('')
  const [customTask, setCustomTask] = useState('')
  const [cycle, setCycle] = useState('')
  const [customDays, setCustomDays] = useState('')

  const scrollRef = useRef<ScrollView>(null)

  const handleTaskSelect = (task: string) => {
    setSelectedTask(task)
    setCycle('')
  }

  const handleSubmit = () => {
    const name = selectedTask === 'Custom' ? customTask : selectedTask
    const finalCycle = cycle === 'single' ? 'custom' : cycle
    const finalDays = cycle === 'custom' || cycle === 'single' ? parseFloat(customDays) || 1 : null

    if (!name || !finalCycle) return

    onSubmit({ name, cycle: finalCycle, customDays: finalDays })
    resetState()
    onClose()
  }

  const resetState = () => {
    setSelectedTask('')
    setCustomTask('')
    setCycle('')
    setCustomDays('')
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <View />
      </Pressable>
  
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={20}
      >
        <TouchableOpacity onPress={onClose} style={styles.exitButton}>
          <Text style={styles.exitText}>❌</Text>
        </TouchableOpacity>
  
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>➕ Add Task</Text>
  
          {/* Task Selection */}
          {presetTasks.map((task) => (
            <TouchableOpacity
              key={task}
              style={[
                styles.optionButton,
                selectedTask === task && styles.optionSelected,
              ]}
              onPress={() => handleTaskSelect(task)}
            >
              <Text style={styles.optionText}>{task}</Text>
            </TouchableOpacity>
          ))}
  
          <TouchableOpacity
            style={[
              styles.optionButton,
              selectedTask === 'Custom' && styles.optionSelected,
            ]}
            onPress={() => handleTaskSelect('Custom')}
          >
            <Text style={styles.optionText}>✏️ Custom</Text>
          </TouchableOpacity>
  
          {selectedTask === 'Custom' && (
            <TextInput
              placeholder="Enter custom task..."
              style={styles.input}
              value={customTask}
              onChangeText={setCustomTask}
            />
          )}
  
          {/* Cycle Picker */}
          {selectedTask !== '' && (
            <>
              <Text style={styles.subTitle}>Repeat Cycle</Text>
              {['weekly', 'biweekly', 'monthly', 'custom', 'single'].map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.optionButton,
                    cycle === c && styles.optionSelected,
                  ]}
                  onPress={() => setCycle(c)}
                >
                  <Text style={styles.optionText}>
                    {c === 'single' ? '🔂 Single Time' : c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
  
              {(cycle === 'custom' || cycle === 'single') && (
                <TextInput
                  placeholder="Enter # of days"
                  keyboardType="numeric"
                  style={styles.input}
                  value={customDays}
                  onChangeText={setCustomDays}
                />
              )}
            </>
          )}
  
          {/* Submit */}
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitText}>Add Task</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    height: SCREEN_HEIGHT * 0.66,
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  exitButton: {
    position: 'absolute',
    top: 10,
    right: 16,
    zIndex: 10,
  },
  exitText: {
    fontSize: 22,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  subTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 14,
    marginBottom: 4,
  },
  optionButton: {
    padding: 10,
    backgroundColor: '#f5f5f5',
    marginVertical: 4,
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#FFE600',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    padding: 10,
    backgroundColor: '#eee',
    borderRadius: 8,
    marginVertical: 8,
  },
  submitButton: {
    backgroundColor: '#000',
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: {
    color: '#FFE600',
    fontWeight: 'bold',
    fontSize: 16,
  },
})
