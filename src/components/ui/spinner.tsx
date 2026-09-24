import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl"
}

const sizeClasses = {
  sm: "h-4 w-4 stroke-[2.5]",
  md: "h-6 w-6 stroke-[2]",
  lg: "h-8 w-8 stroke-[2]",
  xl: "h-12 w-12 stroke-[1.5]",
}

export function Spinner({ size = "md", className, ...props }: SpinnerProps) {
  return (
    <div role="status" className={cn("inline-flex items-center justify-center", className)} {...props}>
      <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
      <span className="sr-only">Loading...</span>
    </div>
  )
}
