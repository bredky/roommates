import mongoose from "mongoose";
import { unique } from "next/dist/build/utils";

const HouseholdSchema = new mongoose.Schema({
  name: String,
  code: {type: String, unique: true},
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }]
});

export default mongoose.models.Household || mongoose.model("Household", HouseholdSchema);
