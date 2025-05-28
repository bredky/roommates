import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import SwipeableLedgerCard from '../components/SwipeableLedgerCard'

const API_BASE = 'http://192.168.1.208:3000'

export default function LedgerPage() {
  const [ledgerData, setLedgerData] = useState({ lastWeekPoints: 0, payments: [], history: [], daysUntilReset: null })

  const fetchLedgerData = async () => {
    const token = await SecureStore.getItemAsync('token')

    const [userRes, splitRes, historyRes] = await Promise.all([
      fetch(`${API_BASE}/api/user/mobile-me`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/ledger/split`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${API_BASE}/api/ledger/history`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
    ])

    const user = await userRes.json()
    const split = await splitRes.json()
    const history = await historyRes.json()

    let daysUntilReset: number | null = null

    if (user.nextReset) {
      const nextReset = new Date(user.nextReset)
      const now = new Date()
      const msDiff = nextReset.getTime() - now.getTime()
      daysUntilReset = Math.ceil(msDiff / (1000 * 60 * 60 * 24))
      console.log(`⏳ Next reset in ${daysUntilReset} days (${msDiff / (1000 * 60 * 60)} hours)`)
    }

    setLedgerData({
      lastWeekPoints: user.lastWeekPoints || 0,
      payments: split.map((p: any, i: number) => ({
        id: p.toUser,
        name: p.name || `Roommate ${i + 1}`,
        amount: p.amount
      })),
      history: history.map((h: any, i: number) => ({
        id: h._id || `h${i}`,
        text: `🪷 ${new Date(h.timestamp).toLocaleDateString()} - ${h.reason} - $${h.amount}`
      })),
      daysUntilReset
    })
  }

  const confirmPayment = async (toUserId: string) => {
    const token = await SecureStore.getItemAsync('token')
    await fetch(`${API_BASE}/api/ledger/confirm`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toUserId }),
    })

    fetchLedgerData()
  }

  useEffect(() => {
    fetchLedgerData()
  }, [])

  return (
    <View style={{ flex: 1, backgroundColor: '#FFE600' }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView style={styles.container}>
          <Text style={styles.header}>🧾 Last Week You Had: {ledgerData.lastWeekPoints} Points</Text>
          {ledgerData.daysUntilReset !== null && (
            <Text style={styles.subheader}>⏳ Next reset in {ledgerData.daysUntilReset} days</Text>
          )}

          <Text style={styles.sectionTitle}>💸 Who You Need to Pay</Text>
          {ledgerData.payments.length === 0 && (
            <Text style={styles.historyText}>🎉 You're all settled!</Text>
          )}
          {ledgerData.payments.map((entry) => (
            <SwipeableLedgerCard
              key={entry.id}
              entry={entry}
              onConfirm={() => confirmPayment(entry.id)}
            />
          ))}

          <Text style={styles.sectionTitle}>📜 Ledger History</Text>
          {ledgerData.history.length === 0 && (
            <Text style={styles.historyText}>No history yet.</Text>
          )}
          {ledgerData.history.map((entry) => (
            <Text key={entry.id} style={styles.historyText}>{entry.text}</Text>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#000',
    padding: 20,
    flex: 1,
  },
  header: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subheader: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  historyText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 5,
  },
})
