import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

interface NavItemProps extends React.ComponentProps<"a"> {
  asChild?: boolean
  isActive?: boolean
}

// A place in a side navigation: muted at rest, a 10% ink tint when it is the current one.
function NavItem({ asChild = false, isActive = false, className, ...props }: NavItemProps) {
  const Comp = asChild ? Slot : "a"

  return (
    <Comp
      data-slot="nav-item"
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex h-8 w-full items-center gap-2.5 rounded-md px-2.5 text-sm outline-none transition-colors duration-150 ease-[var(--ease-out)] focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-4 [&_svg]:shrink-0",
        isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

// Trailing count in a nav item, in tabular mono so columns of numbers line up.
function NavItemCount({ className, ...props }: React.ComponentProps<"span">) {
  return <span className={cn("ml-auto font-mono text-xs tabular-nums text-muted-foreground", className)} {...props} />
}

export { NavItem, NavItemCount }
