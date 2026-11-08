import * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
  illustration?: React.ReactNode
  title: string
  description?: React.ReactNode
  // The next step, so an empty screen always leads somewhere.
  action?: React.ReactNode
  className?: string
}

// The serif title is the screen's moment of ceremony (DESIGN.md, The Ceremony Rule).
function EmptyState({ illustration, title, description, action, className }: EmptyStateProps) {
  return (
    <div data-slot="empty-state" className={cn("flex flex-col items-center px-6 py-16 text-center", className)}>
      {illustration && <div className="mb-6">{illustration}</div>}
      <h2 className="font-serif text-3xl italic leading-tight text-foreground">{title}</h2>
      {description && <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>}
      {action && <div className="mt-6 flex flex-col items-center gap-2">{action}</div>}
    </div>
  )
}

export { EmptyState }
