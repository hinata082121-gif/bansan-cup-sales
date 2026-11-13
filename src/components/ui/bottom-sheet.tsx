"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { AnimatePresence, motion, useDragControls } from "motion/react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** 閉じると判定する下方向の移動量（px）と速度（px/s） */
const CLOSE_OFFSET = 110;
const CLOSE_VELOCITY = 650;
const SHEET_SPRING = { type: "spring", stiffness: 420, damping: 38, mass: 0.9 } as const;

type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  /** 読み上げ用の説明（見た目には出さない） */
  description?: string;
  children: React.ReactNode;
  /** 下に固定する領域（保存ボタンなど） */
  footer?: React.ReactNode;
  /**
   * true のとき、閉じようとすると「入力内容を破棄しますか？」と確認する（入力途中のフォームなど）。
   * 破棄を選ぶと onDiscard → onOpenChange(false) の順に呼ぶ。
   */
  confirmClose?: boolean;
  onDiscard?: () => void;
  className?: string;
};

/**
 * 下から出てくるシート（モーダル）。
 * - スプリングで下から出現し、上部（つまみ・タイトル）を下にスワイプすると閉じる
 * - 背景のタップ・Esc・× でも閉じる。confirmClose なら閉じる前に確認する
 * - フォーカスの閉じ込めや読み上げは Radix Dialog に任せる
 */
function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  confirmClose = false,
  onDiscard,
  className,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const sheetRef = React.useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  const requestClose = React.useCallback(() => {
    if (confirmClose) setConfirmOpen(true);
    else onOpenChange(false);
  }, [confirmClose, onOpenChange]);

  const discard = () => {
    setConfirmOpen(false);
    onDiscard?.();
    onOpenChange(false);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : requestClose())}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-black/45"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </DialogPrimitive.Overlay>
            <DialogPrimitive.Content
              asChild
              forceMount
              // 説明が無いときは Radix の警告を抑える（あるときは Description と自動で関連付く）
              {...(description ? {} : { "aria-describedby": undefined })}
              // 開いた瞬間に入力欄へフォーカスしてキーボードが出ないよう、シート自体にフォーカスする
              onOpenAutoFocus={(e) => {
                e.preventDefault();
                sheetRef.current?.focus();
              }}
            >
              <motion.div
                ref={sheetRef}
                tabIndex={-1}
                className={cn(
                  "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-lg bg-card text-card-foreground outline-none",
                  className,
                )}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={SHEET_SPRING}
                drag="y"
                dragListener={false}
                dragControls={dragControls}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.04, bottom: 0.75 }}
                onDragEnd={(_, info) => {
                  if (info.offset.y > CLOSE_OFFSET || info.velocity.y > CLOSE_VELOCITY) requestClose();
                }}
              >
                {/* つまみとタイトル部分をつかんで下にスワイプできる */}
                <div
                  className="shrink-0 cursor-grab touch-none border-b border-border active:cursor-grabbing"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div aria-hidden className="mx-auto mt-2 h-1.5 w-11 rounded-full bg-foreground/20" />
                  <div className="flex items-center justify-between gap-2 py-1.5 pr-1.5 pl-4">
                    <DialogPrimitive.Title className="text-lg leading-snug font-black">{title}</DialogPrimitive.Title>
                    <DialogPrimitive.Close asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="閉じる"
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        <X />
                      </Button>
                    </DialogPrimitive.Close>
                  </div>
                  {description && <DialogPrimitive.Description className="sr-only">{description}</DialogPrimitive.Description>}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">{children}</div>

                {footer && (
                  <div className="shrink-0 border-t border-border bg-card px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
                    {footer}
                  </div>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>入力内容を破棄しますか？</AlertDialogTitle>
            <AlertDialogDescription>保存していない内容は失われます。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>編集を続ける</AlertDialogCancel>
            <AlertDialogAction variant="danger" onClick={discard}>
              破棄する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DialogPrimitive.Root>
  );
}

export { BottomSheet, type BottomSheetProps };
