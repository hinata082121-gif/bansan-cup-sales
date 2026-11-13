"use client";

import { CircleCheck, Info, LoaderCircle, OctagonX, TriangleAlert } from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * トースト。画面下はタブとボタンがあるので上に出す。
 * チャコールの面に明るい文字（ダークモードでは反転）で、短く・はっきり伝える。
 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
      mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)", left: "12px", right: "12px" }}
      gap={8}
      icons={{
        success: <CircleCheck className="size-5 text-brand dark:text-success" />,
        info: <Info className="size-5" />,
        warning: <TriangleAlert className="size-5 text-brand dark:text-brand-soft-foreground" />,
        error: <OctagonX className="size-5 text-primary-soft dark:text-destructive" />,
        loading: <LoaderCircle className="size-5 animate-spin" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex w-full items-center gap-3 rounded-lg bg-toast px-4 py-3.5 text-[15px] leading-snug font-bold text-toast-foreground",
          title: "font-bold",
          description: "mt-0.5 text-sm font-medium opacity-80",
          actionButton:
            "ml-auto h-9 shrink-0 rounded-md bg-brand px-3 text-sm font-bold text-brand-foreground",
          cancelButton: "ml-auto h-9 shrink-0 rounded-md px-3 text-sm font-bold opacity-80",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
