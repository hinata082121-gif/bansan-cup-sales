"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { toast } from "sonner";
import { Store as StoreIcon, Trash2, UserPlus, X } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import { useSaveVisit } from "@/lib/data/visits";
import { PREFECTURES } from "@/lib/prefectures";
import {
  EMPLOYMENT_TYPE_LABELS,
  FLYER_STATUS_LABELS,
  GENDER_LABELS,
  SOCCER_INTEREST_LABELS,
  options,
} from "@/lib/labels";
import { emptyStaff, snapshot, validateVisit, type StaffInput, type VisitFormValues } from "@/lib/visits/form";
import { todayJst } from "@/hooks/use-today";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Textarea } from "@/components/ui/textarea";
import { StoreAutocomplete } from "@/components/stores/store-autocomplete";

const LAST_PREFECTURE_KEY = "bansan-cup-sales:last-prefecture";
const COLLAPSE = { type: "spring", stiffness: 420, damping: 40 } as const;

export function readLastPrefecture(): string {
  try {
    return localStorage.getItem(LAST_PREFECTURE_KEY) ?? "";
  } catch {
    return "";
  }
}
function rememberPrefecture(prefecture: string) {
  try {
    localStorage.setItem(LAST_PREFECTURE_KEY, prefecture);
  } catch {
    // 保存できなくても困らない
  }
}

/** 新規入力の初期値。訪問日は今日、都道府県は前回選んだもの */
export function newVisitValues(opts: { storeId?: string | null; date?: string | null } = {}): VisitFormValues {
  const today = todayJst();
  const date = opts.date && /^\d{4}-\d{2}-\d{2}$/.test(opts.date) && opts.date <= today ? opts.date : today;
  return {
    visit_date: date,
    prefecture: opts.storeId ? "" : readLastPrefecture(),
    store_id: opts.storeId ?? null,
    flyer_status: "",
    staff: [emptyStaff()],
    note: "",
  };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: VisitFormValues;
  /** 編集のときの記録 ID（新規は null） */
  visitId: string | null;
  stores: Store[] | undefined;
  onSaved: (visitId: string) => void;
};

/**
 * 営業記録の登録・編集モーダル（下から出るシート）。
 * 項目の順: 訪問日 → 店舗（都道府県 → 店舗名） → チラシ → 会話スタッフ（複数） → 備考
 */
export function VisitFormSheet({ open, onOpenChange, initial, visitId, stores, onSaved }: Props) {
  const [values, setValues] = useState(initial);
  const [initialSnapshot] = useState(() => snapshot(initial));
  // 店舗名を入れたまま候補を選ばずに離れたら、エラーを表示する（入力中は出さない）
  const [storeLeftUnselected, setStoreLeftUnselected] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveVisit = useSaveVisit();
  const staffEndRef = useRef<HTMLDivElement>(null);
  const today = todayJst();

  const storeMap = useMemo(() => new Map((stores ?? []).map((s) => [s.id, s])), [stores]);
  const selectedStore = values.store_id ? storeMap.get(values.store_id) : undefined;
  // 店舗から開いたときは、その店舗の都道府県を選んだことにする
  const prefecture = values.prefecture || selectedStore?.prefecture || "";
  const storesInPrefecture = useMemo(
    () => (stores ?? []).filter((s) => s.prefecture === prefecture),
    [stores, prefecture],
  );

  const errors = validateVisit(values, today);
  const dirty = snapshot(values) !== initialSnapshot;
  const canSave = !errors.store_id && !errors.visit_date && saveState === "idle";

  const set = <K extends keyof VisitFormValues>(key: K, value: VisitFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const setStaff = (key: string, patch: Partial<StaffInput>) =>
    setValues((v) => ({ ...v, staff: v.staff.map((s) => (s.key === key ? { ...s, ...patch } : s)) }));

  const addStaff = () => {
    setValues((v) => ({ ...v, staff: [...v.staff, emptyStaff()] }));
    // 追加したカードが見えるようにスクロール（展開アニメーションのあと）
    setTimeout(() => staffEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 280);
  };
  const removeStaff = (key: string) => setValues((v) => ({ ...v, staff: v.staff.filter((s) => s.key !== key) }));

  const save = async () => {
    if (!canSave) return;
    setSaveState("saving");
    try {
      const id = await saveVisit.mutateAsync({ values: { ...values, prefecture }, visitId });
      rememberPrefecture(prefecture);
      setSaveState("success");
      toast.success("営業履歴を保存しました");
      setTimeout(() => {
        onSaved(id);
        onOpenChange(false);
      }, 700);
    } catch (e) {
      setSaveState("idle");
      const message = e instanceof Error ? e.message : String(e);
      toast.error("保存できませんでした", {
        description: message.includes("未来の日付") ? "訪問日に未来の日付は指定できません" : "通信状況を確認して、もう一度お試しください",
      });
    }
  };

  const storeError = storeLeftUnselected && errors.store_id ? errors.store_id : undefined;

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={visitId ? "営業記録を編集" : "営業記録をつける"}
      description="訪問日・店舗・会話したスタッフなどを入力します"
      confirmClose={dirty && saveState === "idle"}
      footer={
        <div className="flex flex-col gap-2">
          {!values.store_id && (
            <p className="text-center text-xs font-bold text-muted-foreground">店舗を選ぶと保存できます</p>
          )}
          <SaveButton state={saveState} onClick={save} disabled={!canSave} />
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* 1. 訪問日 */}
        <Field label="訪問日" htmlFor="visit-date" required hint="あとからまとめて入力するときは変更してください" error={errors.visit_date}>
          <Input
            id="visit-date"
            type="date"
            value={values.visit_date}
            max={today}
            onChange={(e) => set("visit_date", e.target.value)}
            aria-invalid={errors.visit_date ? true : undefined}
            aria-describedby="visit-date-hint"
          />
        </Field>

        {/* 2. 店舗（都道府県 → 店舗名のオートコンプリート） */}
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 flex items-center gap-2 text-sm font-bold">
            店舗
            <span className="rounded-sm bg-primary-soft px-1.5 py-0.5 text-[11px] leading-none text-primary-soft-foreground">必須</span>
          </legend>
          <NativeSelect
            aria-label="都道府県"
            placeholder="都道府県を選んでください"
            value={prefecture}
            onChange={(e) => {
              const next = e.target.value;
              setValues((v) => ({
                ...v,
                prefecture: next,
                store_id: v.store_id && storeMap.get(v.store_id)?.prefecture === next ? v.store_id : null,
              }));
            }}
          >
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>

          <AnimatePresence mode="popLayout" initial={false}>
            {selectedStore ? (
              <motion.div
                key={`selected-${selectedStore.id}`}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-3 rounded-lg border-2 border-foreground bg-brand-soft py-2 pr-1 pl-3.5"
              >
                <StoreIcon aria-hidden className="size-5 shrink-0 text-brand-soft-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-black">{selectedStore.name}</span>
                  <span className="block text-xs font-medium text-brand-soft-foreground">
                    {selectedStore.prefecture} {selectedStore.city}
                  </span>
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => set("store_id", null)}
                >
                  <X />
                  変更
                </Button>
              </motion.div>
            ) : (
              <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <StoreAutocomplete
                  id="visit-store"
                  stores={storesInPrefecture}
                  disabled={!prefecture || !stores}
                  placeholder={prefecture ? "店舗名（ひらがなでもOK）" : "先に都道府県を選んでください"}
                  invalid={Boolean(storeError)}
                  describedBy={storeError ? "visit-store-error" : undefined}
                  onQueryChange={() => setStoreLeftUnselected(false)}
                  onBlurWithText={() => setStoreLeftUnselected(true)}
                  onSelect={(store) => {
                    setStoreLeftUnselected(false);
                    set("store_id", store.id);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {storeError && (
            <p id="visit-store-error" role="alert" className="-mt-1 text-sm font-medium text-destructive">
              {storeError}
            </p>
          )}
        </fieldset>

        {/* 3. チラシ配布状況 */}
        <Field label="チラシ配布状況" htmlFor="visit-flyer">
          <NativeSelect
            id="visit-flyer"
            placeholder="選択してください"
            value={values.flyer_status}
            onChange={(e) => set("flyer_status", e.target.value as VisitFormValues["flyer_status"])}
          >
            {options(FLYER_STATUS_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        {/* 4〜8. 会話スタッフ（1 人ぶんのセットを追加できる） */}
        <LayoutGroup>
          <motion.div layout="position" className="flex flex-col">
            <p className="mb-2 text-sm font-bold">会話したスタッフ</p>
            <AnimatePresence initial={false}>
              {values.staff.map((staff, index) => (
                <motion.div
                  key={staff.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={COLLAPSE}
                  className="overflow-hidden"
                >
                  <div className="pb-3">
                    <StaffFields
                      index={index}
                      staff={staff}
                      onChange={(patch) => setStaff(staff.key, patch)}
                      onRemove={index > 0 ? () => removeStaff(staff.key) : undefined}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={staffEndRef} />
          </motion.div>

          <motion.div layout="position" transition={COLLAPSE}>
            <Button variant="outline" block onClick={addStaff}>
              <UserPlus />
              会話スタッフ人数を追加する
            </Button>
          </motion.div>

          {/* 9. 備考 */}
          <motion.div layout="position" transition={COLLAPSE}>
            <Field label="備考" htmlFor="visit-note">
              <Textarea id="visit-note" value={values.note} onChange={(e) => set("note", e.target.value)} placeholder="お店の様子、次回の作戦など" />
            </Field>
          </motion.div>
        </LayoutGroup>
      </div>
    </BottomSheet>
  );
}

/** 会話スタッフ 1 人ぶん（名前・性別・雇用形態・会話記録・サッカーへの興味） */
function StaffFields({
  index,
  staff,
  onChange,
  onRemove,
}: {
  index: number;
  staff: StaffInput;
  onChange: (patch: Partial<StaffInput>) => void;
  onRemove?: () => void;
}) {
  const id = (name: string) => `${staff.key}-${name}`;
  return (
    <section aria-label={`スタッフ ${index + 1}`} className="flex flex-col gap-4 rounded-lg border border-border bg-muted/50 p-3.5">
      <div className="-my-1 flex items-center justify-between">
        <p className="flex items-baseline gap-1.5 font-black">
          スタッフ<span className="num text-xl">{index + 1}</span>
        </p>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive" aria-label={`スタッフ ${index + 1} を削除`}>
            <Trash2 />
            削除
          </Button>
        )}
      </div>
      <Field label="会話スタッフ名" htmlFor={id("name")}>
        <Input
          id={id("name")}
          value={staff.staff_name}
          onChange={(e) => onChange({ staff_name: e.target.value })}
          placeholder="聞けなければ空欄でOK"
          autoComplete="off"
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="性別" htmlFor={id("gender")}>
          <NativeSelect
            id={id("gender")}
            placeholder="選択"
            value={staff.gender}
            onChange={(e) => onChange({ gender: e.target.value as StaffInput["gender"] })}
          >
            {options(GENDER_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="雇用形態" htmlFor={id("employment")}>
          <NativeSelect
            id={id("employment")}
            placeholder="選択"
            value={staff.employment_type}
            onChange={(e) => onChange({ employment_type: e.target.value as StaffInput["employment_type"] })}
          >
            {options(EMPLOYMENT_TYPE_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </div>
      <Field label="会話記録" htmlFor={id("conversation")}>
        <Textarea
          id={id("conversation")}
          value={staff.conversation}
          onChange={(e) => onChange({ conversation: e.target.value })}
          placeholder="話した内容をメモ"
        />
      </Field>
      <Field label="サッカーへの興味" htmlFor={id("soccer")}>
        <NativeSelect
          id={id("soccer")}
          placeholder="選択してください"
          value={staff.soccer_interest}
          onChange={(e) => onChange({ soccer_interest: e.target.value as StaffInput["soccer_interest"] })}
        >
          {options(SOCCER_INTEREST_LABELS).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </Field>
    </section>
  );
}
