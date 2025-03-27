import { NextApiRequest, NextApiResponse } from "next";
import {connectDB} from "@/lib/mongodb";
import Household from "@/lib/models/Household";
import Task from "@/lib/models/Task";
import User from "@/lib/models/User";

export default async function (
    req: NextApiRequest,
    res: NextApiResponse
  ) {
  if (req.method !== "POST") return res.status(405).end();

  await connectDB();
  const { userId, code } = req.body;

  const household = await Household.findOne({ code });
  if (!household) return res.status(404).json({ error: "Invalid code" });

  if (household.members.includes(userId)) {
    return res.status(400).json({ error: "Already a member" });
  }

  household.members.push(userId);
  await household.save();

  await User.findByIdAndUpdate(userId, { householdId: household._id });

  // redistribute tasks
  const tasks = await Task.find({ householdId: household._id });
  const memberCount = household.members.length;

  const updates = tasks.map((task, idx) => {
    const newAssignee = household.members[idx % memberCount];
    return Task.findByIdAndUpdate(task._id, { assignedTo: newAssignee });
  });

  await Promise.all(updates);

  res.status(200).json({ message: "Joined successfully", household });
}
