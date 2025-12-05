"use client"

import { CustomCursor } from "@/components/ui/custom-cursor"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { toast } from "sonner"
import { X } from "lucide-react"

export default function LD2CursorSection() {
  return (
    <section className="w-full flex justify-center bg-white">
      <CustomCursor.Provider>
        {({ setCursorStyle, setCursorChildren, containerRef }) => {
          const handleHeadingCursor = () => {
            setCursorChildren(
              <div className="bg-white min-w-5 min-h-5 rounded-full" />
            )
            setCursorStyle({
              scale: 6,
              mixBlendMode: "difference",
            })
          }

          const handleMouseLeave = () => {
            setCursorChildren(
              <div className="bg-black min-w-5 min-h-5 rounded-full" />
            )
            setCursorStyle({})
          }

          const handleLinkCursor = () => {
            setCursorChildren(
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg shadow-xl bg-[#0a0a0a] border border-white/10">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-[#E8400D] to-[#D0B2FF] flex items-center justify-center">
                  <svg viewBox="0 0 40 40" fill="none" className="w-4 h-4">
                    <path d="M11.7699 21.8258L7.42207 20.485C5 19.9996 5 20 6.6277 17.875L9.77497 13.9892C10.4003 13.2172 11.3407 12.7687 12.3342 12.7687L19.2668 13.0726M11.7699 21.8258C11.7699 21.8258 12.8773 24.5436 14.1667 25.833C15.4561 27.1223 18.1738 28.2296 18.1738 28.2296M18.1738 28.2296L19.0938 32.0266C19.5 34.5 19.5 34.5 21.6117 33.0063L25.7725 30.2146C26.684 29.603 27.2308 28.5775 27.2308 27.4798L26.927 20.733M26.927 20.733C31.5822 16.4657 34.5802 12.4926 34.9962 6.59335C35.1164 4.8888 35.1377 4.88137 33.4062 5.00345C27.507 5.41937 23.534 8.4174 19.2668 13.0726M11.7699 31.6146C11.7699 33.4841 10.2544 34.9996 8.38495 34.9996H5V31.6146C5 29.7453 6.5155 28.2298 8.38495 28.2298C10.2544 28.2298 11.7699 29.7453 11.7699 31.6146Z" fill="white" />
                    <path d="M12.5 22.9996L11 20.4996C11 20.0996 16 12.9996 20 12.9996C22.1667 14.8329 26.1172 16.4682 27 19.9996C27.5 21.9996 21.5 26.1663 18.5 28.4996L12.5 22.9996Z" fill="white" />
                  </svg>
                </div>
                <span className="text-white text-sm font-medium">AlphaLabs Docs</span>
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            )
          }

          const handleButtonCursor = () => {
            setCursorStyle({ scale: 0.4 })
          }

          return (
            <div
              ref={containerRef}
              className="relative max-w-4xl w-full flex flex-col items-center justify-center text-center py-24 px-6 min-h-[80vh] bg-white cursor-none"
            >
              <CustomCursor className="bg-black min-w-5 min-h-5 rounded-full" />

              <h2
                className="text-4xl md:text-5xl lg:text-6xl tracking-tight font-semibold text-black mb-6"
                onMouseEnter={handleHeadingCursor}
                onMouseLeave={handleMouseLeave}
              >
                Build smarter{" "}
                <span className="text-black/70 italic font-serif">trading agents</span>{" "}
                with AI.
              </h2>

              <p
                className="max-w-2xl text-lg text-black/60 mb-8"
                onMouseEnter={handleHeadingCursor}
                onMouseLeave={handleMouseLeave}
              >
                Create, backtest, and deploy AI-powered trading strategies with confidence.
                Our platform gives you the tools to automate your trading and maximize returns.
              </p>

              <div className="flex gap-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-black text-white hover:bg-gray-800"
                  onMouseEnter={handleButtonCursor}
                  onMouseLeave={handleMouseLeave}
                >
                  <Link href="/dashboard">
                    Start Building
                  </Link>
                </Button>
                <Button
                  variant="link"
                  size="lg"
                  className="text-black"
                  onMouseEnter={handleLinkCursor}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => {
                    toast("Coming Soon", {
                      description: "Documentation is on the way! We're preparing complete guides and tutorials for you. 📚",
                      action: {
                        label: <X className="size-4" />,
                        onClick: () => toast.dismiss(),
                      },
                    });
                  }}
                >
                  Learn more
                </Button>
              </div>
            </div>
          )
        }}
      </CustomCursor.Provider>
    </section>
  )
}
