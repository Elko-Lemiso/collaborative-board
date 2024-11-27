"use client";

import { useRouter } from "next/navigation";
import { UsernameForm } from "@/components/Auth/UsernameForm";
import { AuthFormData } from "@/lib/types/auth";
import { useState } from "react";

export default function AuthPage() {
  const router = useRouter();

  return <UsernameForm />;
}
