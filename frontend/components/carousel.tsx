'use client';

import { useState, useEffect } from 'react';

export function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const items = [1, 2, 3]; // Empty state - 3 placeholder items

  // Autoplay
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [items.length]);

  return (
    <div className="relative w-full h-full">
      {/* Carousel items */}
      <div className="relative w-full h-full overflow-hidden">
        {items.map((item, index) => (
          <div
            key={item}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentIndex ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="w-full h-full flex items-center justify-center">
              {/* Empty state placeholder */}
            </div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'w-8 bg-white/60'
                : 'w-1.5 bg-white/20 hover:bg-white/40'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

