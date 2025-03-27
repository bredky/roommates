import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  householdId: { type: mongoose.Schema.Types.ObjectId, ref: "Household" },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
