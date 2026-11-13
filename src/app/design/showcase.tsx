"use client";

import * as React from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  List,
  MapPin,
  Monitor,
  Moon,
  NotebookPen,
  Plus,
  RotateCcw,
  Sun,
  Trash2,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { userColorVar } from "@/lib/user-color";
import { useTodayJst } from "@/hooks/use-today";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SaveButton, type SaveState } from "@/components/ui/save-button";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

// -----------------------------------------------------------------------------
// 共通
// -----------------------------------------------------------------------------

function Section({ no, title, note, children }: { no: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-t-2 border-foreground px-4 pt-4 pb-8">
      <h2 className="flex items-baseline gap-2">
        <span className="num text-2xl font-bold">{no}</span>
        <span className="text-xl font-black">{title}</span>
      </h2>
      {note && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note}</p>}
      <div className="mt-4 flex flex-col gap-4">{children}</div>
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-black tracking-wider text-muted-foreground">{children}</p>;
}

/**
 * CSS 変数の色同士のコントラスト比を、表示中のテーマで計算して要素に書き込む。
 * 画面の色（外部の状態）を読むだけなので state は使わず、DOM に直接書く。
 */
function useContrastText(fgVar: string, bgVar: string, theme: string) {
  const ref = React.useRef<HTMLSpanElement>(null);
  React.useEffect(() => {
    if (!ref.current) return;
    // 色の書き方（#fff・#ffffff・rgb() など）に左右されないよう、ブラウザに解釈させた rgb 値を読む
    const probe = document.createElement("span");
    document.body.appendChild(probe);
    const rgb = (cssVar: string) => {
      probe.style.color = `var(${cssVar})`;
      return (getComputedStyle(probe).color.match(/[\d.]+/g) ?? ["0", "0", "0"]).slice(0, 3).map(Number);
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const a = lum(rgb(fgVar));
    const b = lum(rgb(bgVar));
    probe.remove();
    ref.current.textContent = `${((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(1)} : 1`;
  }, [fgVar, bgVar, theme]);
  return ref;
}

type ThemeMode = "system" | "light" | "dark";

// -----------------------------------------------------------------------------
// 01 色
// -----------------------------------------------------------------------------

function Swatch({
  name,
  role,
  bg,
  fg,
  theme,
  large = false,
}: {
  name: string;
  role: string;
  bg: string;
  fg: string;
  theme: string;
  large?: boolean;
}) {
  const ratioRef = useContrastText(fg, bg, theme);
  return (
    <div className={cn("flex flex-col justify-between rounded-lg border border-border p-3", large ? "min-h-28" : "min-h-20")} style={{ background: `var(${bg})`, color: `var(${fg})` }}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("font-black", large ? "text-lg" : "text-sm")}>{name}</span>
        <span ref={ratioRef} className="num shrink-0 text-sm font-semibold" />
      </div>
      <span className="text-xs leading-snug font-medium opacity-90">{role}</span>
    </div>
  );
}

function ColorSection({ theme }: { theme: string }) {
  return (
    <Section no="01" title="色" note="黄は「面」、赤は「点」。右上の数字は文字と背景のコントラスト比（4.5 以上で WCAG AA）。">
      <div className="grid grid-cols-2 gap-2">
        <Swatch large name="黄 brand" role="ヘッダー・選択中・ハイライト。文字はチャコール" bg="--brand" fg="--brand-foreground" theme={theme} />
        <Swatch large name="赤 primary" role="保存・記録するなど主要ボタン、重要な状態" bg="--primary" fg="--primary-foreground" theme={theme} />
        <Swatch name="背景" role="温かいオフホワイト" bg="--background" fg="--foreground" theme={theme} />
        <Swatch name="カード" role="一段明るい面" bg="--card" fg="--foreground" theme={theme} />
        <Swatch name="補足の文字" role="日付・説明など" bg="--background" fg="--muted-foreground" theme={theme} />
        <Swatch name="くぼみ" role="入力の溝・無効" bg="--muted" fg="--muted-foreground" theme={theme} />
        <Swatch name="営業済" role="状態タグ" bg="--success-soft" fg="--success-soft-foreground" theme={theme} />
        <Swatch name="予定あり" role="状態タグ・ハイライト" bg="--brand-soft" fg="--brand-soft-foreground" theme={theme} />
      </div>
      <div>
        <SubLabel>ユーザーごとの色（予定のドットなど・自動で割り当て）</SubLabel>
        <div className="mt-2 flex flex-wrap gap-3">
          {Array.from({ length: 10 }, (_, i) => `c${i + 1}`).map((c) => (
            <span key={c} className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="size-4 rounded-full" style={{ background: userColorVar(c) }} />
              <span className="num text-sm">{c}</span>
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 02 文字
// -----------------------------------------------------------------------------

function TypeSection() {
  return (
    <Section no="02" title="文字" note="見出しは横断幕のような極太、本文は読みやすいゴシック、数字は得点板のような細身で桁をそろえる。">
      <Card className="divide-y divide-border">
        <div className="p-4">
          <SubLabel>画面の見出し（Dela Gothic One）</SubLabel>
          <p className="mt-1 font-heading text-[26px] leading-tight">店舗一覧</p>
        </div>
        <div className="p-4">
          <SubLabel>カードの見出し（Zen Kaku Gothic New 900）</SubLabel>
          <p className="mt-1 text-xl font-black">池袋東口店</p>
        </div>
        <div className="p-4">
          <SubLabel>本文（16px）</SubLabel>
          <p className="mt-1 leading-relaxed">店長さんと話せた。来月のシフトが出たら声をかけてもらえることに。</p>
          <p className="mt-1 text-sm text-muted-foreground">補足（14px）：東京都豊島区南池袋1丁目</p>
        </div>
        <div className="p-4">
          <SubLabel>数字（Barlow Condensed・等幅）</SubLabel>
          <div className="mt-1 flex items-end gap-5">
            <p>
              <span className="num text-5xl leading-none font-bold">327</span>
              <span className="ml-1 text-sm font-bold">店舗</span>
            </p>
            <p className="num text-3xl leading-none font-semibold">11/08</p>
            <p className="num text-3xl leading-none font-semibold text-muted-foreground">18:30</p>
          </div>
        </div>
      </Card>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 03 ボタン
// -----------------------------------------------------------------------------

function ButtonSection() {
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const save = () => {
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("success");
      toast.success("営業履歴を保存しました");
      setTimeout(() => setSaveState("idle"), 1600);
    }, 900);
  };

  return (
    <Section no="03" title="ボタン" note="押すと軽く縮み、対応端末では小さく振動する。面のボタンは下辺の濃い帯が押すと細くなる。">
      <SubLabel>主要（赤）— 1 画面に 1 つ</SubLabel>
      <Button size="lg" block>
        <Plus strokeWidth={2.6} />
        記録する
      </Button>
      <SubLabel>保存ボタン — 押すと保存中 → 成功のチェック</SubLabel>
      <SaveButton state={saveState} onClick={save} />
      <SubLabel>そのほか</SubLabel>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="brand">
          <CalendarPlus />
          予定を追加
        </Button>
        <Button variant="outline">キャンセル</Button>
        <Button variant="danger">
          <Trash2 />
          削除する
        </Button>
        <Button disabled>押せない状態</Button>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline">
          <MapPin />
          Google マップ
        </Button>
        <Button size="sm" variant="outline">
          <ExternalLink />
          公式ページ
        </Button>
        <Button size="icon" variant="outline" aria-label="前の月">
          <ChevronLeft />
        </Button>
      </div>
      <SubLabel>右下に浮くボタン（記録入力の画面）</SubLabel>
      <div className="flex justify-end">
        <Button size="lg" className="h-14 rounded-full pr-6 pl-5">
          <Plus strokeWidth={2.6} />
          記録する
        </Button>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 04 バッジ
// -----------------------------------------------------------------------------

function BadgeSection() {
  return (
    <Section no="04" title="バッジ" note="ピル型のタグとアイコン。色だけでなく文字でも状態が分かる。">
      <SubLabel>店舗の進捗</SubLabel>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="visited" date="2026-11-08" />
        <StatusBadge status="scheduled" date="2026-11-20" />
        <StatusBadge status="unvisited" />
      </div>
      <SubLabel>再訪予定（営業済と予定ありが同時に付く）</SubLabel>
      <div className="flex flex-wrap gap-2">
        <StatusBadge status="visited" date="2026-11-08" />
        <StatusBadge status="scheduled" date="2026-11-27" />
      </div>
      <SubLabel>記録の属性</SubLabel>
      <div className="flex flex-wrap gap-2">
        <Badge variant="success">チラシ 配布</Badge>
        <Badge variant="neutral">チラシ 未配布</Badge>
        <Badge variant="brand">サッカー 興味あり</Badge>
        <Badge variant="solid">店長</Badge>
        <Badge variant="neutral">アルバイト</Badge>
      </div>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 05 カード・リスト
// -----------------------------------------------------------------------------

const PREFS = [
  { name: "埼玉県", total: 41, visited: 6, scheduled: 3 },
  { name: "東京都", total: 198, visited: 31, scheduled: 9 },
  { name: "神奈川県", total: 43, visited: 4, scheduled: 2 },
  { name: "千葉県", total: 45, visited: 0, scheduled: 1 },
];

function ProgressBar({ total, visited, scheduled }: { total: number; visited: number; scheduled: number }) {
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted" aria-hidden>
      <div className="bg-success" style={{ width: `${(visited / total) * 100}%` }} />
      <div className="bg-brand" style={{ width: `${(scheduled / total) * 100}%` }} />
    </div>
  );
}

function CardSection() {
  return (
    <Section no="05" title="カード・リスト" note="影は付けず、罫線と背景の差で区切る。情報の重みで大きさを変える。">
      <SubLabel>都道府県（店舗一覧の第1階層）</SubLabel>
      <div className="grid grid-cols-2 gap-2">
        {PREFS.map((p) => (
          <motion.button
            key={p.name}
            type="button"
            whileTap={{ scale: 0.97 }}
            className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3.5 text-left outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
          >
            <span className="text-lg leading-none font-black">{p.name}</span>
            <span className="flex items-baseline gap-1">
              <span className="num text-4xl leading-none font-bold">{p.total}</span>
              <span className="text-xs font-bold text-muted-foreground">店舗</span>
            </span>
            <ProgressBar {...p} />
            <span className="text-xs font-bold text-muted-foreground">
              営業済 <span className="num text-sm text-foreground">{p.visited}</span>
              <span className="mx-1.5">/</span>
              予定 <span className="num text-sm text-foreground">{p.scheduled}</span>
            </span>
          </motion.button>
        ))}
      </div>

      <SubLabel>市区町村（第2階層）</SubLabel>
      <Card className="divide-y divide-border overflow-hidden">
        {[
          ["新宿区", 17],
          ["世田谷区", 13],
          ["豊島区", 12],
        ].map(([name, count]) => (
          <button key={name} type="button" className="flex min-h-14 w-full items-center gap-3 px-4 text-left active:bg-muted">
            <span className="flex-1 font-bold">{name}</span>
            <span className="num text-lg font-semibold text-muted-foreground">{count}</span>
            <ChevronRight aria-hidden className="size-5 text-muted-foreground" />
          </button>
        ))}
      </Card>

      <SubLabel>店舗（第3階層）</SubLabel>
      <Card className="divide-y divide-border overflow-hidden">
        <StoreRow name="池袋東口店" address="豊島区東池袋1丁目" badges={[<StatusBadge key="v" status="visited" date="2026-11-08" />, <StatusBadge key="s" status="scheduled" date="2026-11-27" />]} />
        <StoreRow name="池袋サンシャイン通り店" address="豊島区東池袋1丁目" badges={[<StatusBadge key="s" status="scheduled" date="2026-11-20" />]} />
        <StoreRow name="池袋メトロポリタン口店" address="豊島区西池袋1丁目" badges={[<StatusBadge key="u" status="unvisited" />]} />
      </Card>

      <SubLabel>営業記録</SubLabel>
      <VisitCard />
    </Section>
  );
}

function StoreRow({ name, address, badges }: { name: string; address: string; badges: React.ReactNode[] }) {
  return (
    <button type="button" className="flex w-full items-center gap-3 px-4 py-3 text-left active:bg-muted">
      <span className="min-w-0 flex-1">
        <span className="block font-bold">{name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{address}</span>
        <span className="mt-2 flex flex-wrap gap-1.5">{badges}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function VisitCard() {
  return (
    <Card className="overflow-hidden">
      <div className="flex gap-3.5 p-4">
        <div className="flex w-12 shrink-0 flex-col items-center self-start rounded-md bg-muted py-1.5">
          <span className="num text-xs font-semibold text-muted-foreground">11月</span>
          <span className="num text-[28px] leading-none font-bold">8</span>
          <span className="text-[11px] font-bold text-muted-foreground">日</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[17px] leading-snug font-black">池袋東口店</p>
          <p className="text-xs text-muted-foreground">東京都 豊島区</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="success">チラシ 配布</Badge>
            <Badge variant="neutral">
              <UsersRound aria-hidden />
              スタッフ <span className="num text-[13px]">2</span>人
            </Badge>
          </div>
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed">店長さんと話せた。来月のシフトが出たら声をかけてもらえることに。</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-border bg-muted/50 px-4 py-2 text-xs font-bold text-muted-foreground">
        <span className="size-2.5 rounded-full" style={{ background: userColorVar("c2") }} />
        ひなた
      </div>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// 06 入力
// -----------------------------------------------------------------------------

function FormSection() {
  const today = useTodayJst();
  return (
    <Section no="06" title="入力" note="高さ 48px・文字 16px（iOS で勝手にズームしない）。フォーカス中は黄色の太い輪郭。プルダウンは端末標準の選択画面が出る。">
      <Field label="訪問日" htmlFor="d-date" required hint="初期値は今日。未来の日付は選べない">
        <Input key={today ?? "pending"} id="d-date" type="date" defaultValue={today ?? undefined} max={today ?? undefined} />
      </Field>
      <Field label="都道府県" htmlFor="d-pref" required>
        <NativeSelect id="d-pref" defaultValue="東京都">
          <option>埼玉県</option>
          <option>東京都</option>
          <option>神奈川県</option>
          <option>千葉県</option>
        </NativeSelect>
      </Field>
      <Field label="店舗" htmlFor="d-store" required error="候補から店舗を選んでください">
        <Input id="d-store" defaultValue="いけぶ" aria-invalid />
      </Field>
      <Field label="チラシ配布状況" htmlFor="d-flyer">
        <NativeSelect id="d-flyer" placeholder="選択してください" defaultValue="">
          <option value="distributed">配布</option>
          <option value="not_distributed">未配布</option>
          <option value="previously_distributed">前回以前配布済</option>
        </NativeSelect>
      </Field>
      <Field label="会話記録" htmlFor="d-note">
        <Textarea id="d-note" placeholder="話した内容をメモ" />
      </Field>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 07 切り替え
// -----------------------------------------------------------------------------

function ToggleSection() {
  const [view, setView] = React.useState<"calendar" | "list">("calendar");
  const [filter, setFilter] = React.useState<"all" | "unvisited" | "scheduled" | "visited">("all");
  return (
    <Section no="07" title="切り替え" note="選択中の印がスプリングで滑る。下の中身はクロスフェードで入れ替わる。">
      <Segmented
        ariaLabel="表示形式"
        value={view}
        onChange={setView}
        options={[
          { value: "calendar", label: "カレンダー", icon: CalendarDays },
          { value: "list", label: "リスト", icon: List },
        ]}
      />
      <div className="relative h-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={view}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 flex items-center justify-center rounded-lg border border-dashed border-input text-sm font-bold text-muted-foreground"
          >
            {view === "calendar" ? "カレンダー表示の中身" : "リスト表示の中身"}
          </motion.div>
        </AnimatePresence>
      </div>
      <SubLabel>絞り込み（店舗一覧の上部）</SubLabel>
      <Segmented
        variant="chips"
        ariaLabel="絞り込み"
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "すべて", count: 327 },
          { value: "unvisited", label: "未訪問", count: 300 },
          { value: "scheduled", label: "予定あり", count: 12 },
          { value: "visited", label: "営業済", count: 15 },
        ]}
      />
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 08 動き
// -----------------------------------------------------------------------------

const LEVELS = [
  { crumb: "店舗一覧", title: "都道府県", items: ["埼玉県", "東京都", "神奈川県", "千葉県"] },
  { crumb: "埼玉県", title: "埼玉県の市区町村", items: ["さいたま市", "越谷市", "久喜市", "戸田市"] },
  { crumb: "さいたま市", title: "さいたま市の店舗", items: ["浦和店", "大宮西口店", "大宮東口店", "北浦和店"] },
];

function SlideDemo() {
  const [[level, direction], setState] = React.useState<[number, number]>([0, 0]);
  const go = (next: number) => setState([next, next > level ? 1 : -1]);
  const current = LEVELS[level];
  return (
    <Card className="overflow-hidden">
      <nav aria-label="パンくず" className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2 text-sm">
        {LEVELS.slice(0, level + 1).map((l, i) => (
          <React.Fragment key={l.crumb}>
            {i > 0 && <ChevronRight aria-hidden className="size-4 text-muted-foreground" />}
            {i === level ? (
              <span className="px-1 font-black">{l.crumb}</span>
            ) : (
              <button type="button" onClick={() => go(i)} className="rounded-sm px-1 py-1 font-bold text-muted-foreground underline decoration-brand decoration-2 underline-offset-4">
                {l.crumb}
              </button>
            )}
          </React.Fragment>
        ))}
      </nav>
      <div className="relative h-60 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={level}
            custom={direction}
            variants={{
              enter: (d: number) => ({ x: d >= 0 ? "100%" : "-30%", opacity: d >= 0 ? 1 : 0.4 }),
              center: { x: 0, opacity: 1 },
              exit: (d: number) => ({ x: d >= 0 ? "-30%" : "100%", opacity: d >= 0 ? 0.4 : 1 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="absolute inset-0 bg-card"
          >
            <p className="px-4 pt-3 pb-1 text-xs font-black text-muted-foreground">{current.title}</p>
            <ul className="divide-y divide-border">
              {current.items.map((item) => (
                <li key={item}>
                  <button
                    type="button"
                    disabled={level === LEVELS.length - 1}
                    onClick={() => go(level + 1)}
                    className="flex min-h-12 w-full items-center px-4 text-left font-bold active:bg-muted disabled:font-medium"
                  >
                    <span className="flex-1">{item}</span>
                    {level < LEVELS.length - 1 && <ChevronRight aria-hidden className="size-5 text-muted-foreground" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </Card>
  );
}

function StaggerDemo() {
  const [key, setKey] = React.useState(0);
  return (
    <div className="flex flex-col gap-2">
      <motion.ul
        key={key}
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05 } } }}
        className="flex flex-col gap-2"
      >
        {["蒲田西口店", "蒲田東口店", "大森北口店", "池上店", "雑色店"].map((name) => (
          <motion.li
            key={name}
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.28 } } }}
            className="flex h-12 items-center rounded-md border border-border bg-card px-4 font-bold"
          >
            {name}
          </motion.li>
        ))}
      </motion.ul>
      <Button variant="outline" size="sm" onClick={() => setKey((k) => k + 1)} className="self-start">
        <RotateCcw />
        もう一度再生
      </Button>
    </div>
  );
}

function MotionSection() {
  const [loading, setLoading] = React.useState(true);
  return (
    <Section no="08" title="動き" note="階層を進むと右から、戻ると左からスライド。リストは少しずつ遅れて現れる。">
      <SubLabel>パンくずと画面のスライド（店舗一覧で使う）</SubLabel>
      <SlideDemo />
      <SubLabel>リストのスタッガー表示</SubLabel>
      <StaggerDemo />
      <SubLabel>読み込み中（スケルトン）</SubLabel>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">形だけ先に見せる</span>
        <Button size="sm" variant="outline" onClick={() => setLoading((v) => !v)}>
          {loading ? "読み込み完了にする" : "読み込み中にする"}
        </Button>
      </div>
      {loading ? (
        <Card className="flex gap-3.5 p-4">
          <Skeleton className="h-16 w-12" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-6 w-1/2 rounded-full" />
          </div>
        </Card>
      ) : (
        <VisitCard />
      )}
      <SubLabel>0 件のとき</SubLabel>
      <Card>
        <EmptyState
          icon={NotebookPen}
          title="まだ営業記録がありません"
          description="店舗を訪問したら、ここに記録をつけましょう。"
          action={
            <Button>
              <Plus strokeWidth={2.6} />
              最初の記録をつける
            </Button>
          }
        />
      </Card>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// 09 ボトムシート・トースト
// -----------------------------------------------------------------------------

function SheetSection() {
  const [open, setOpen] = React.useState(false);
  const [store, setStore] = React.useState("");
  const [note, setNote] = React.useState("");
  const [saveState, setSaveState] = React.useState<SaveState>("idle");
  const dirty = store !== "" || note !== "";

  const reset = () => {
    setStore("");
    setNote("");
    setSaveState("idle");
  };
  const save = () => {
    setSaveState("saving");
    setTimeout(() => {
      setSaveState("success");
      toast.success("営業履歴を保存しました");
      setTimeout(() => {
        setOpen(false);
        setTimeout(reset, 300);
      }, 650);
    }, 800);
  };

  return (
    <Section
      no="09"
      title="シート・トースト"
      note="下からスプリングで出て、上のつまみを下にスワイプすると閉じる。入力途中で閉じようとすると確認が出る。"
    >
      <Button variant="brand" block onClick={() => setOpen(true)}>
        記録入力シートを開く
      </Button>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="outline" onClick={() => toast.success("営業履歴を保存しました")}>
          成功トースト
        </Button>
        <Button variant="outline" onClick={() => toast.error("保存できませんでした", { description: "通信状況を確認して、もう一度お試しください" })}>
          失敗トースト
        </Button>
      </div>

      <BottomSheet
        open={open}
        onOpenChange={setOpen}
        title="営業記録をつける"
        confirmClose={dirty && saveState === "idle"}
        onDiscard={reset}
        footer={<SaveButton state={saveState} onClick={save} disabled={!store} />}
      >
        <div className="flex flex-col gap-5">
          <Field label="店舗" htmlFor="s-store" required hint="何か入力してから閉じると確認が出ます">
            <Input id="s-store" value={store} onChange={(e) => setStore(e.target.value)} placeholder="例：池袋東口店" />
          </Field>
          <Field label="チラシ配布状況" htmlFor="s-flyer">
            <NativeSelect id="s-flyer" placeholder="選択してください" defaultValue="">
              <option value="distributed">配布</option>
              <option value="not_distributed">未配布</option>
              <option value="previously_distributed">前回以前配布済</option>
            </NativeSelect>
          </Field>
          <Field label="備考" htmlFor="s-note">
            <Textarea id="s-note" value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </div>
      </BottomSheet>
    </Section>
  );
}

// -----------------------------------------------------------------------------
// ページ
// -----------------------------------------------------------------------------

export function DesignShowcase() {
  const [theme, setTheme] = React.useState<ThemeMode>("system");
  const [tab, setTab] = React.useState("/stores");

  // 子の useEffect（コントラスト計算）より先に反映されるよう layout effect で切り替える
  React.useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <AppHeader>
        <span className="mr-3 rounded-full bg-brand-foreground/10 px-3 py-1.5 text-xs font-black">見本</span>
      </AppHeader>
      <PageHeader title="デザイン見本" meta="色・文字・部品をまとめて確認するためのページです" />
      <div className="px-4 pb-6">
        <Segmented
          ariaLabel="配色"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "自動", icon: Monitor },
            { value: "light", label: "ライト", icon: Sun },
            { value: "dark", label: "ダーク", icon: Moon },
          ]}
        />
      </div>
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))]">
        <ColorSection theme={theme} />
        <TypeSection />
        <ButtonSection />
        <BadgeSection />
        <CardSection />
        <FormSection />
        <ToggleSection />
        <MotionSection />
        <SheetSection />
        <p className="px-4 pb-8 text-center text-xs text-muted-foreground">下のタブは押すと選択中の札が滑ります（このページでは画面は切り替わりません）</p>
      </main>
      <BottomNav demo={{ active: tab, onSelect: setTab }} />
    </div>
  );
}
