// components/ui/LoadingScreen.tsx
import React, { useMemo } from 'react'
import { View, Text, StyleSheet } from 'react-native'


export default function LoadingScreen() {
// lib/constants/quipData.ts
const quips = [
  "Tip: If you sprinkle when you tinkle, be a sweetie and wipe the seatie.",
  "Fact: Someone in your house is a clean freak. It's not you.",
  "Q: Why don’t chores get lonely? A: Because they pile up.",
  "Reminder: Last one to shower should clean the drain. You know who you are.",
  "Pro Tip: If you ghost your chores, they come back to haunt you.",
  "Fun Fact: The microwave doesn’t clean itself.",
  "Alert: The trash isn’t a suggestion. It’s a lifestyle.",
  "Honest Question: Do you even own a sponge?",
  "Pro Tip: Blaming your roommate only works once. Maybe twice.",
]

  const quip = useMemo(() => {
    const index = Math.floor(Math.random() * quips.length)
    return quips[index]
  }, [])

  return (
    <View style={styles.container}>
      {/* Mascot animation goes here */}
      <View style={styles.mascot}>
        {/* Replace this with your mascot animation component */}
        <Text style={styles.mascotText}>🐾</Text>
      </View>
      <Text style={styles.quip}>{quip}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFE600', // bright yellow
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  mascot: {
    marginBottom: 20,
  },
  mascotText: {
    fontSize: 60,
  },
  quip: {
    fontSize: 18,
    textAlign: 'center',
    color: '#333',
    fontWeight: '600',
  },
})
