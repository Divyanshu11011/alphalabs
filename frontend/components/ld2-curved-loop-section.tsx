"use client"

import CurvedLoop from "@/components/CurvedLoop"

export default function LD2CurvedLoopSection() {
  return (
    <section className="w-full bg-white py-12 overflow-hidden">
      <CurvedLoop
        marqueeText="AlphaLabs ✦ AI Trading ✦ Smart Agents ✦ Backtesting ✦ Analytics ✦ "
        speed={2}
        curveAmount={200}
        interactive={true}
        className="fill-black"
      />
    </section>
  )
}

