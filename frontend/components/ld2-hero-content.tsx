'use client'

import Link from "next/link";

export default function LD2HeroContent() {
  return (
    <div
      className="flex flex-col items-center justify-start gap-6 pt-24 px-4 relative z-10"
    >
      <div className="flex flex-col items-center justify-start gap-7">
        {/* NEW Badge */}
        <Link
          href="/dashboard/arena/backtest"
          className="flex items-center gap-2 border border-gray-200 bg-white rounded-lg px-2.5 py-1 text-xs text-black no-underline transition-all duration-200 hover:shadow-md"
          style={{
            boxShadow: "rgba(17, 17, 17, 0.05) 0px 0px 1px, rgba(17, 17, 17, 0.04) 1px 1px 1px, rgba(17, 17, 17, 0.03) 2px 3px 2px",
          }}
        >
          <div className="bg-black text-white text-[10px] font-medium px-1.5 py-1 rounded tracking-wide">
            NEW
          </div>
          <div className="opacity-80">
            Backtest your strategies with AI Agents →
          </div>
        </Link>

        {/* Heading */}
        <h1
          className="text-center text-black font-normal leading-none max-w-[29.5rem]"
          style={{
            fontSize: "3.5rem",
            letterSpacing: "-2.8px",
            textWrap: "balance",
          }}
        >
          <span className="italic">Build</span> smarter{" "}
          <span className="italic">trading</span> agents with{" "}
          <span className="italic">AI</span>
        </h1>
      </div>

      {/* Subheading */}
      <p
        className="text-center text-black opacity-60 font-normal max-w-[25rem]"
        style={{
          fontSize: "1.25rem",
          letterSpacing: "-0.4px",
          lineHeight: 1.3,
        }}
      >
        Create, backtest, and forward-test autonomous trading strategies powered by machine learning.
      </p>

      {/* CTA Buttons */}
      <div className="flex items-center gap-3 mt-4">
        <Link
          href="/dashboard"
          className="px-6 py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-black/80 transition-colors"
        >
          Get started free
        </Link>
        <Link
          href="#"
          className="px-6 py-3 border border-gray-300 text-black text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
        >
          Watch demo
        </Link>
      </div>
    </div>
  );
}

