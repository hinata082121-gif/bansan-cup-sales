import * as React from "react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "./input";

/** 複数行入力。入力に合わせて高さが伸びる（対応ブラウザのみ） */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldControlClass, "field-sizing-content min-h-28 py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export { Textarea };
