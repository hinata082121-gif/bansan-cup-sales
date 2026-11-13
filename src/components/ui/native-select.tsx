import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { fieldControlClass } from "./input";

/**
 * プルダウン。スマホでは OS 標準の選択 UI（iOS のホイールなど）が出るよう、ネイティブの select を使う。
 * placeholder を渡すと、未選択の状態を選べる。
 */
function NativeSelect({
  className,
  placeholder,
  children,
  ...props
}: React.ComponentProps<"select"> & { placeholder?: string }) {
  return (
    <div className="relative">
      <select
        data-slot="native-select"
        className={cn(
          fieldControlClass,
          "h-12 appearance-none pr-10 has-[option[value='']:checked]:text-muted-foreground",
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { NativeSelect };
