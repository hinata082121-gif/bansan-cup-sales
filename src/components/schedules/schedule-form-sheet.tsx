"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, Reorder, motion, useDragControls } from "motion/react";
import { toast } from "sonner";
import { GripVertical, X } from "lucide-react";
import type { Store } from "@/lib/data/stores";
import { useSaveSchedule } from "@/lib/data/schedules";
import { PREFECTURES } from "@/lib/prefectures";
import { TIME_SLOT_LABELS, options } from "@/lib/labels";
import { addStore, snapshotSchedule, validateSchedule, type ScheduleFormValues } from "@/lib/schedules/form";
import { readLastPrefecture, rememberPrefecture } from "@/lib/last-prefecture";
import { todayJst } from "@/hooks/use-today";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Textarea } from "@/components/ui/textarea";
import { StoreAutocomplete } from "@/components/stores/store-autocomplete";

/** 新規の予定の初期値 */
export function newScheduleValues(date?: string | null): ScheduleFormValues {
  const today = todayJst();
  return { date: date && date >= today ? date : today, time_slot: "", store_ids: [], memo: "" };
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ScheduleFormValues;
  /** 編集のときの予定 ID と、もとの予定日（過去の予定を日付を変えずに直せるように） */
  scheduleId: string | null;
  originalDate: string | null;
  stores: Store[] | undefined;
};

/**
 * 営業予定の登録・編集モーダル。
 * 予定日（今日以降）・時間帯（任意）・回る店舗（任意・複数。都道府県 → 店舗名で追加し、チップで並べる。
 * × で外し、つまみをドラッグして回る順番を並べ替える）・メモ（任意）
 */
export function ScheduleFormSheet({ open, onOpenChange, initial, scheduleId, originalDate, stores }: Props) {
  const [values, setValues] = useState(initial);
  const [initialSnapshot] = useState(() => snapshotSchedule(initial));
  const [prefecture, setPrefecture] = useState(() => readLastPrefecture());
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveSchedule = useSaveSchedule();
  const today = todayJst();

  const storeMap = useMemo(() => new Map((stores ?? []).map((s) => [s.id, s])), [stores]);
  const storesInPrefecture = useMemo(() => (stores ?? []).filter((s) => s.prefecture === prefecture), [stores, prefecture]);
  const selectedIds = useMemo(() => new Set(values.store_ids), [values.store_ids]);

  const errors = validateSchedule(values, today, originalDate);
  const dirty = snapshotSchedule(values) !== initialSnapshot;
  const canSave = !errors.date && saveState === "idle";
  const minDate = originalDate && originalDate < today ? originalDate : today;

  const set = <K extends keyof ScheduleFormValues>(key: K, value: ScheduleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  const save = async () => {
    if (!canSave) return;
    setSaveState("saving");
    try {
      await saveSchedule.mutateAsync({ values, scheduleId });
      rememberPrefecture(prefecture);
      setSaveState("success");
      toast.success("営業予定を保存しました");
      setTimeout(() => onOpenChange(false), 700);
    } catch (e) {
      setSaveState("idle");
      const message = e instanceof Error ? e.message : String(e);
      toast.error("保存できませんでした", {
        description: message.includes("過去の日付") ? "予定日に過去の日付は指定できません" : "通信状況を確認して、もう一度お試しください",
      });
    }
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={scheduleId ? "営業予定を編集" : "営業予定を追加"}
      description="予定日・時間帯・回る店舗・メモを入力します"
      confirmClose={dirty && saveState === "idle"}
      footer={<SaveButton state={saveState} onClick={save} disabled={!canSave} />}
    >
      <div className="flex flex-col gap-5">
        <Field label="予定日" htmlFor="schedule-date" required error={errors.date}>
          <Input
            id="schedule-date"
            type="date"
            value={values.date}
            min={minDate}
            onChange={(e) => set("date", e.target.value)}
            aria-invalid={errors.date ? true : undefined}
          />
        </Field>

        <Field label="時間帯" htmlFor="schedule-slot">
          <NativeSelect
            id="schedule-slot"
            placeholder="選択しない"
            value={values.time_slot}
            onChange={(e) => set("time_slot", e.target.value as ScheduleFormValues["time_slot"])}
          >
            {options(TIME_SLOT_LABELS).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1.5 flex items-baseline gap-2 text-sm font-bold">
            回る店舗
            <span className="text-xs font-medium text-muted-foreground">任意・複数選べます</span>
          </legend>
          <NativeSelect aria-label="都道府県" placeholder="都道府県を選んでください" value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
            {PREFECTURES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </NativeSelect>
          <StoreAutocomplete
            id="schedule-store"
            stores={storesInPrefecture}
            excludeIds={selectedIds}
            disabled={!prefecture || !stores}
            placeholder={prefecture ? "店舗名で追加（ひらがなでもOK）" : "先に都道府県を選んでください"}
            onSelect={(store) => set("store_ids", addStore(values.store_ids, store.id))}
          />

          {values.store_ids.length > 0 && (
            <div>
              <Reorder.Group axis="y" values={values.store_ids} onReorder={(ids) => set("store_ids", ids)} className="flex flex-col gap-1.5" aria-label="回る順番">
                <AnimatePresence initial={false}>
                  {values.store_ids.map((id, index) => (
                    <StoreChip
                      key={id}
                      id={id}
                      index={index}
                      store={storeMap.get(id)}
                      onRemove={() => set("store_ids", values.store_ids.filter((x) => x !== id))}
                    />
                  ))}
                </AnimatePresence>
              </Reorder.Group>
              {values.store_ids.length > 1 && (
                <p className="mt-2 text-xs text-muted-foreground">左のつまみをドラッグすると、回る順番を入れ替えられます。</p>
              )}
            </div>
          )}
        </fieldset>

        <Field label="メモ" htmlFor="schedule-memo">
          <Textarea id="schedule-memo" value={values.memo} onChange={(e) => set("memo", e.target.value)} placeholder="集合場所、一緒に回る人など" />
        </Field>
      </div>
    </BottomSheet>
  );
}

/** 選んだ店舗のチップ。つまみでドラッグして順番を変え、× で外す */
function StoreChip({ id, index, store, onRemove }: { id: string; index: number; store: Store | undefined; onRemove: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={id}
      dragListener={false}
      dragControls={controls}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileDrag={{ scale: 1.03 }}
      className="relative flex h-12 items-center gap-2 rounded-md border border-border bg-card pr-1"
    >
      <span
        role="button"
        tabIndex={-1}
        aria-label={`${store?.name ?? id} の順番を入れ替える`}
        onPointerDown={(e) => controls.start(e)}
        className="flex h-full w-10 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-5" />
      </span>
      <span className="num flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-sm font-bold text-background">
        {index + 1}
      </span>
      <span className="min-w-0 flex-1 truncate">
        <span className="font-bold">{store?.name ?? `店舗 ${id}`}</span>
        {store && <span className="ml-1.5 text-xs text-muted-foreground">{store.city}</span>}
      </span>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={onRemove}
        aria-label={`${store?.name ?? id} を外す`}
        className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground active:bg-muted"
      >
        <X className="size-5" />
      </motion.button>
    </Reorder.Item>
  );
}
