"use server";

import { redirect } from "next/navigation";
import { signOutQuietly } from "@/lib/auth/server";

export async function signOut() {
  await signOutQuietly();
  redirect("/login");
}
