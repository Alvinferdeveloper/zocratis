"use client"

import * as React from "react"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"

interface SearchFieldProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  // Single key that focuses the field from anywhere on the page, shown as a hint while empty.
  shortcut?: string
}

const isTypingTarget = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))

function SearchField({ shortcut, className, value, onKeyDown, ...props }: SearchFieldProps) {
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!shortcut) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== shortcut || event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return
      event.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shortcut])

  return (
    <div className={cn("relative", className)}>
      <Search aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onKeyDown={(event) => {
          if (event.key === "Escape") event.currentTarget.blur()
          onKeyDown?.(event)
        }}
        className="h-8 border-transparent bg-secondary pl-8 pr-8 text-sm hover:border-transparent focus-visible:bg-card [&::-webkit-search-cancel-button]:hidden"
        {...props}
      />
      {shortcut && !value && (
        <Kbd
          aria-hidden
          className="pointer-events-none absolute right-2 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-[5px] border border-border bg-card px-1 text-[11px] text-muted-foreground opacity-100"
        >
          {shortcut}
        </Kbd>
      )}
    </div>
  )
}

export { SearchField }
