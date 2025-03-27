"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.ok) router.push("/dashboard");
    else alert("Invalid email or password");
  };

  return (
    <div className="p-6 max-w-md mx-auto flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Log In</h1>
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-2"
      />
      <Input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="mb-4"
      />
      <Button onClick={handleLogin} className="w-full mb-2">
        Log In
      </Button>

      {/* Signup redirect link */}
      <p className="text-sm text-gray-600 mt-4">
        Don't have an account?{" "}
        <button
          onClick={() => router.push("/signup")}
          className="text-blue-600 underline hover:text-blue-800"
        >
          Sign up here
        </button>
      </p>
    </div>
  );
}
