import mongoose from 'mongoose'

const ActivitySchema = new mongoose.Schema({
  type: String,
  taskName: String,
  deletedBy: String,
  points: Number,
  timestamp: Date,
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: 'Household' },
})

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema)
