"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { createProfile, type OnboardingState } from "./actions";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SaveButton } from "@/components/ui/save-button";

const initialState: OnboardingState = { error: null, displayName: "" };

export function OnboardingForm() {
  const searchParams = useSearchParams();
  const [state, formAction, pending] = useActionState(createProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="next" value={searchParams.get("next") ?? ""} />
      <Field label="表示名" htmlFor="display_name" required hint="20文字以内で入力してください。" error={state.error}>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={state.displayName}
          maxLength={20}
          required
          autoFocus
          autoComplete="nickname"
          placeholder="例：ひなた"
          aria-invalid={state.error ? true : undefined}
          aria-describedby="display_name-hint"
        />
      </Field>
      <SaveButton type="submit" state={pending ? "saving" : "idle"}>
        登録してはじめる
      </SaveButton>
    </form>
  );
}
