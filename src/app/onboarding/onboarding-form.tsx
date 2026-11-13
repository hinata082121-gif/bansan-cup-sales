"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import { createProfile, type OnboardingState } from "./actions";

const initialState: OnboardingState = { error: null, displayName: "" };

export function OnboardingForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(createProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-bold">表示名</span>
        <input
          name="display_name"
          defaultValue={state.displayName}
          maxLength={20}
          required
          autoFocus
          autoComplete="nickname"
          placeholder="例：ひなた"
          aria-invalid={state.error ? true : undefined}
          aria-describedby="display-name-help"
          className="h-12 rounded-md border border-border bg-background px-3 text-base outline-none focus:border-foreground"
        />
        <span id="display-name-help" className="text-sm text-muted-foreground">
          20文字以内で入力してください。
        </span>
      </label>
      {state.error && (
        <p role="alert" className="flex items-start gap-2 rounded-md bg-primary/10 px-3 py-2.5 text-sm text-primary">
          <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-12 rounded-md bg-primary px-4 text-base font-bold text-primary-foreground transition active:scale-[0.97] disabled:opacity-60"
      >
        {pending ? "登録しています…" : "登録してはじめる"}
      </button>
    </form>
  );
}
