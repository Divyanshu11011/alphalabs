"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export type TextureVariant =
  | "fabric-of-squares"
  | "grid-noise"
  | "inflicted"
  | "debut-light"
  | "groovepaper"
  | "none"

interface BackgroundImageTextureProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: TextureVariant
  opacity?: number
  children?: React.ReactNode
}

const texturePatterns: Record<TextureVariant, string> = {
  "fabric-of-squares": `data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='fabric' width='30' height='30' patternUnits='userSpaceOnUse'%3E%3Crect width='15' height='15' fill='%23ffffff' opacity='0.03'/%3E%3Crect x='15' y='15' width='15' height='15' fill='%23ffffff' opacity='0.03'/%3E%3Cpath d='M0 0h30v30h-30z' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.05'/%3E%3Cpath d='M0 0h15v15h-15z' fill='none' stroke='%23ffffff' stroke-width='0.3' opacity='0.08'/%3E%3Cpath d='M15 15h15v15h-15z' fill='none' stroke='%23ffffff' stroke-width='0.3' opacity='0.08'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='60' height='60' fill='url(%23fabric)'/%3E%3C/svg%3E`,
  "grid-noise": `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='noise' width='100' height='100' patternUnits='userSpaceOnUse'%3E%3Crect width='100' height='100' fill='%23ffffff'/%3E%3Cpath d='M0 0h100v100H0z' fill='url(%23noise-pattern)'/%3E%3C/pattern%3E%3Cfilter id='noise-filter'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Cpattern id='noise-pattern'%3E%3Crect width='100' height='100' filter='url(%23noise-filter)' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23noise)'/%3E%3C/svg%3E`,
  "inflicted": `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='inflicted' width='40' height='40' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 20h40M20 0v40' fill='none' stroke='%23ffffff' stroke-width='1' opacity='0.1'/%3E%3Cpath d='M0 0l40 40M40 0l-40 40' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.05'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23inflicted)'/%3E%3C/svg%3E`,
  "debut-light": `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='debut' width='20' height='20' patternUnits='userSpaceOnUse'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23ffffff' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23debut)'/%3E%3C/svg%3E`,
  "groovepaper": `data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='groove' width='100' height='4' patternUnits='userSpaceOnUse'%3E%3Cpath d='M0 2h100' fill='none' stroke='%23ffffff' stroke-width='0.5' opacity='0.1'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100' height='100' fill='url(%23groove)'/%3E%3C/svg%3E`,
  "none": "",
}

export function BackgroundImageTexture({
  variant = "fabric-of-squares",
  opacity = 0.5,
  className,
  children,
  ...props
}: BackgroundImageTextureProps) {
  const textureUrl = texturePatterns[variant]

  return (
    <div className={cn("relative", className)} {...props}>
      {variant !== "none" && textureUrl && (
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("${textureUrl}")`,
            backgroundRepeat: "repeat",
            backgroundSize: variant === "fabric-of-squares" ? "60px 60px" : "100px 100px",
            opacity: opacity,
          }}
        />
      )}
      {children && <div className="relative z-10">{children}</div>}
    </div>
  )
}

