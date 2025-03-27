import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
  name: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household" },
  completed: Boolean,
});

export default mongoose.models.Task || mongoose.model("Task", TaskSchema);
