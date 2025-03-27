import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();
  await connectDB();

  const existing = await User.findOne({ email });
  if (existing) return new Response("User already exists", { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  await User.create({ name, email, password: hashed });

  return new Response("User created", { status: 200 });
}
