"use client"

import LogoCarousel from "@/components/ui/logo-carousel"

export default function LD2LogoCarouselSection() {
  return (
    <section className="w-full bg-white py-20">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-sm text-black/50 uppercase tracking-wider mb-2">
            Powered by leading AI models
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-black">
            Built with the best LLMs
          </h2>
        </div>
        
        <div className="flex justify-center">
          <LogoCarousel columnCount={4} />
        </div>
      </div>
    </section>
  )
}

