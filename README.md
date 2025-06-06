# 🏠 Roommate Management App

A fun, gamified mobile app built with **React Native** and **Next.js** that helps roommates stay accountable by assigning and rotating chores, reporting messes with images, and voting on task responsibility. Built for college dorms and apartments.

---

## 📱 Features

- **Household Creation & Joining**  
  Users can create or join a household using a unique join code.

- **Chore Management**  
  - Add preset or custom tasks with deadline cycles (weekly, biweekly, etc).
  - Tasks are auto-assigned fairly using a rotating workload logic.
  - Overdue tasks result in point penalties.

- **Gamified Point System**  
  - Users gain points for failing to complete tasks on time.
  - Points reset every 7 days.
  - At 3 points: owe $3 to each roommate.  
    At 5 points: owe $5 to each.

- **Mess Reporting & Voting**  
  - Snap a picture of a mess.
  - Initiate a **targeted** or **open** vote.
  - If majority agrees, a task is assigned and points are issued.

- **Weekly Ledger & Payment Tracker**  
  - Automatic logs of who owes whom each week based on point thresholds.
  - Smart payment minimization logic.

- **Realtime Experience**  
  - Smart client-side caching with Zustand.
  - Background sync with `updated-since` API endpoints.
  - Optimistic UI for smooth task updates.

---

## 🧱 Tech Stack

### Frontend:
- React Native (Expo)
- Zustand (State Management)
- SecureStore (Token Storage)

### Backend:
- Next.js 13 App Router
- MongoDB + Mongoose
- JWT Auth (Secure mobile login)
- RESTful API Routes (`/api/auth`, `/api/task`, `/api/household`, etc.)

---

## 🚀 Getting Started

### Prerequisites
- Node.js
- MongoDB Atlas or local MongoDB instance
- Expo Go (for mobile testing)
- `.env` file with:



### Installation

```bash
# Backend / API Server
cd backend
npm install
npm run dev

# Mobile App
cd mobile
npm install
npx expo start
