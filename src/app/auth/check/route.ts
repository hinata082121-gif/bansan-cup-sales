import type { NextRequest } from "next/server";
import { redirect, unstable_rethrow } from "next/navigation";
import { resolveSignedInDestination, signOutQuietly } from "@/lib/auth/server";

/** 許可リストの照合済み Cookie が無い・期限切れのときに proxy から回される */
export async function GET(request: NextRequest) {
  let destination: string;
  try {
    destination = await resolveSignedInDestination(request.nextUrl.searchParams.get("next"));
  } catch (e) {
    unstable_rethrow(e); // Next.js 内部の制御用エラー（事前描画の中断など）は握りつぶさない
    console.error(e);
    await signOutQuietly();
    destination = "/login?error=check";
  }
  redirect(destination);
}
