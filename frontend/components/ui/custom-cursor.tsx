"use client"

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  type ReactNode,
  type CSSProperties,
  type RefObject,
} from "react"
import { motion, useMotionValue, useSpring } from "motion/react"
import { cn } from "@/lib/utils"

interface CursorStyle {
  scale?: number
  mixBlendMode?: CSSProperties["mixBlendMode"]
}

interface CursorContextType {
  setCursorStyle: (style: CursorStyle) => void
  setCursorChildren: (children: ReactNode) => void
  containerRef: RefObject<HTMLDivElement | null>
}

const CursorContext = createContext<CursorContextType | null>(null)

interface CustomCursorProviderProps {
  children: ReactNode | ((context: CursorContextType) => ReactNode)
}

function CustomCursorProvider({ children }: CustomCursorProviderProps) {
  const [cursorStyle, setCursorStyle] = useState<CursorStyle>({})
  const [cursorChildren, setCursorChildren] = useState<ReactNode>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const contextValue: CursorContextType = {
    setCursorStyle,
    setCursorChildren,
    containerRef,
  }

  return (
    <CursorContext.Provider value={contextValue}>
      <CursorStateProvider cursorStyle={cursorStyle} cursorChildren={cursorChildren}>
        {typeof children === "function" ? children(contextValue) : children}
      </CursorStateProvider>
    </CursorContext.Provider>
  )
}

// Internal context for cursor state
const CursorStateContext = createContext<{
  cursorStyle: CursorStyle
  cursorChildren: ReactNode
}>({ cursorStyle: {}, cursorChildren: null })

function CursorStateProvider({
  children,
  cursorStyle,
  cursorChildren,
}: {
  children: ReactNode
  cursorStyle: CursorStyle
  cursorChildren: ReactNode
}) {
  return (
    <CursorStateContext.Provider value={{ cursorStyle, cursorChildren }}>
      {children}
    </CursorStateContext.Provider>
  )
}

interface CustomCursorProps {
  className?: string
  children?: ReactNode
}

function CustomCursorComponent({ className, children }: CustomCursorProps) {
  const context = useContext(CursorContext)
  const stateContext = useContext(CursorStateContext)
  
  if (!context) {
    throw new Error("CustomCursor must be used within CustomCursor.Provider")
  }

  const { containerRef } = context
  const { cursorStyle, cursorChildren } = stateContext

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 }
  const cursorX = useSpring(mouseX, springConfig)
  const cursorY = useSpring(mouseY, springConfig)

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    }

    const handleMouseEnter = () => setIsVisible(true)
    const handleMouseLeave = () => setIsVisible(false)

    container.addEventListener("mousemove", handleMouseMove)
    container.addEventListener("mouseenter", handleMouseEnter)
    container.addEventListener("mouseleave", handleMouseLeave)

    return () => {
      container.removeEventListener("mousemove", handleMouseMove)
      container.removeEventListener("mouseenter", handleMouseEnter)
      container.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [containerRef, mouseX, mouseY])

  return (
    <motion.div
      className={cn(
        "pointer-events-none absolute z-50 flex items-center justify-center",
        !cursorChildren && className
      )}
      style={{
        left: 0,
        top: 0,
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        opacity: isVisible ? 1 : 0,
        scale: cursorStyle.scale || 1,
        mixBlendMode: cursorStyle.mixBlendMode || "normal",
      }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
    >
      {cursorChildren || children}
    </motion.div>
  )
}

export const CustomCursor = Object.assign(CustomCursorComponent, {
  Provider: CustomCursorProvider,
})

export { CustomCursorProvider }
