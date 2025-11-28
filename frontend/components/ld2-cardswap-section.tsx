"use client"

import CardSwap, { Card } from "@/components/CardSwap"

// Card 1 - Smart Agents with neural network visualization
const Card1Visual = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#0a0a0a]">
    {/* Gradient mesh background */}
    <div className="absolute inset-0">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#E8400D] blur-[80px] opacity-60" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#D0B2FF] blur-[60px] opacity-50" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-[#FFEED8] blur-[50px] opacity-40" />
    </div>
    
    {/* Neural network visualization - full width coverage */}
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 500" fill="none" preserveAspectRatio="xMidYMid slice">
      {/* Connection lines - spread across full width */}
      <path d="M-20 120 L80 160 L200 130 L320 180 L420 140" stroke="url(#grad1)" strokeWidth="1.5" opacity="0.3" />
      <path d="M-10 180 L100 220 L220 190 L340 240 L410 200" stroke="url(#grad1)" strokeWidth="1" opacity="0.25" />
      <path d="M20 80 L120 140 L240 110 L360 160 L400 130" stroke="url(#grad1)" strokeWidth="1" opacity="0.35" />
      <path d="M0 240 L140 280 L280 250 L380 290" stroke="url(#grad1)" strokeWidth="1" opacity="0.2" />
      <path d="M80 160 L180 220 L280 180 L340 240" stroke="url(#grad1)" strokeWidth="1" opacity="0.3" />
      <path d="M120 140 L200 200 L300 170" stroke="url(#grad1)" strokeWidth="1" opacity="0.25" />
      <path d="M200 130 L220 190 L280 250" stroke="url(#grad1)" strokeWidth="1" opacity="0.2" />
      
      {/* Animated pulses along paths */}
      <circle r="4" fill="#E8400D" opacity="0.9">
        <animateMotion dur="4s" repeatCount="indefinite" path="M-20 120 L80 160 L200 130 L320 180 L420 140" />
      </circle>
      <circle r="3" fill="#D0B2FF" opacity="0.8">
        <animateMotion dur="5s" repeatCount="indefinite" path="M-10 180 L100 220 L220 190 L340 240 L410 200" />
      </circle>
      <circle r="3.5" fill="#FFEED8" opacity="0.8">
        <animateMotion dur="4.5s" repeatCount="indefinite" path="M20 80 L120 140 L240 110 L360 160 L400 130" />
      </circle>
      <circle r="2.5" fill="#E8400D" opacity="0.7">
        <animateMotion dur="3.5s" repeatCount="indefinite" path="M0 240 L140 280 L280 250 L380 290" />
      </circle>
      
      {/* Network nodes - spread across full width */}
      {/* Left edge nodes */}
      <circle cx="-20" cy="120" r="6" fill="#E8400D" opacity="0.5" />
      <circle cx="-20" cy="120" r="3" fill="#E8400D" />
      <circle cx="-10" cy="180" r="5" fill="#D0B2FF" opacity="0.4" />
      <circle cx="-10" cy="180" r="2.5" fill="#D0B2FF" />
      <circle cx="0" cy="240" r="7" fill="#FFEED8" opacity="0.4" />
      <circle cx="0" cy="240" r="3.5" fill="#FFEED8" />
      <circle cx="20" cy="80" r="5" fill="#E8400D" opacity="0.5" />
      <circle cx="20" cy="80" r="2.5" fill="#E8400D" />
      
      {/* Center-left nodes */}
      <circle cx="80" cy="160" r="10" fill="#D0B2FF" opacity="0.5" />
      <circle cx="80" cy="160" r="5" fill="#D0B2FF" />
      <circle cx="100" cy="220" r="8" fill="#E8400D" opacity="0.5" />
      <circle cx="100" cy="220" r="4" fill="#E8400D" />
      <circle cx="120" cy="140" r="7" fill="#FFEED8" opacity="0.5" />
      <circle cx="120" cy="140" r="3.5" fill="#FFEED8" />
      <circle cx="140" cy="280" r="9" fill="#D0B2FF" opacity="0.4" />
      <circle cx="140" cy="280" r="4.5" fill="#D0B2FF" />
      
      {/* Center nodes */}
      <circle cx="180" cy="220" r="8" fill="#E8400D" opacity="0.5" />
      <circle cx="180" cy="220" r="4" fill="#E8400D" />
      <circle cx="200" cy="130" r="12" fill="#D0B2FF" opacity="0.4" />
      <circle cx="200" cy="130" r="6" fill="#D0B2FF" />
      <circle cx="200" cy="200" r="6" fill="#FFEED8" opacity="0.5" />
      <circle cx="200" cy="200" r="3" fill="#FFEED8" />
      <circle cx="220" cy="190" r="9" fill="#E8400D" opacity="0.5" />
      <circle cx="220" cy="190" r="4.5" fill="#E8400D" />
      <circle cx="240" cy="110" r="7" fill="#D0B2FF" opacity="0.5" />
      <circle cx="240" cy="110" r="3.5" fill="#D0B2FF" />
      
      {/* Center-right nodes */}
      <circle cx="280" cy="180" r="10" fill="#FFEED8" opacity="0.5" />
      <circle cx="280" cy="180" r="5" fill="#FFEED8" />
      <circle cx="280" cy="250" r="8" fill="#E8400D" opacity="0.4" />
      <circle cx="280" cy="250" r="4" fill="#E8400D" />
      <circle cx="300" cy="170" r="6" fill="#D0B2FF" opacity="0.5" />
      <circle cx="300" cy="170" r="3" fill="#D0B2FF" />
      <circle cx="320" cy="180" r="9" fill="#E8400D" opacity="0.5" />
      <circle cx="320" cy="180" r="4.5" fill="#E8400D" />
      <circle cx="340" cy="240" r="11" fill="#D0B2FF" opacity="0.5" />
      <circle cx="340" cy="240" r="5.5" fill="#D0B2FF" />
      
      {/* Right edge nodes */}
      <circle cx="360" cy="160" r="7" fill="#FFEED8" opacity="0.5" />
      <circle cx="360" cy="160" r="3.5" fill="#FFEED8" />
      <circle cx="380" cy="290" r="8" fill="#E8400D" opacity="0.4" />
      <circle cx="380" cy="290" r="4" fill="#E8400D" />
      <circle cx="400" cy="130" r="6" fill="#D0B2FF" opacity="0.5" />
      <circle cx="400" cy="130" r="3" fill="#D0B2FF" />
      <circle cx="410" cy="200" r="7" fill="#FFEED8" opacity="0.4" />
      <circle cx="410" cy="200" r="3.5" fill="#FFEED8" />
      <circle cx="420" cy="140" r="5" fill="#E8400D" opacity="0.5" />
      <circle cx="420" cy="140" r="2.5" fill="#E8400D" />
      
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#E8400D" />
          <stop offset="50%" stopColor="#D0B2FF" />
          <stop offset="100%" stopColor="#FFEED8" />
        </linearGradient>
      </defs>
    </svg>
    
    {/* Agent status cards */}
    <div className="absolute top-6 left-6 right-6 flex gap-3">
      <div className="flex-1 p-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white/60 text-[10px] uppercase tracking-wider">Active</span>
        </div>
        <div className="text-white text-lg font-semibold">3 Agents</div>
      </div>
      <div className="flex-1 p-3 rounded-lg bg-white/5 backdrop-blur-md border border-white/10">
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-3 h-3 text-[#E8400D]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" opacity="0.3"/>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
          <span className="text-white/60 text-[10px] uppercase tracking-wider">Signals</span>
        </div>
        <div className="text-white text-lg font-semibold">47/hr</div>
      </div>
    </div>
    
    {/* Content */}
    <div className="relative z-10 flex flex-col justify-end h-full p-8">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#E8400D" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span className="text-white/40 text-sm font-medium tracking-wider uppercase">AI Powered</span>
      </div>
      <h3 className="text-white text-2xl font-semibold tracking-tight">Smart Agents</h3>
      <p className="text-white/50 text-sm mt-2">Autonomous trading execution</p>
    </div>
    {/* Decorative grid */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px]" />
  </div>
)

// Card 2 - Backtesting with candlestick visualization
const Card2Visual = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#0a0a0a]">
    {/* Gradient mesh */}
    <div className="absolute inset-0">
      <div className="absolute top-[10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#D0B2FF] blur-[70px] opacity-50" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[#E8400D] blur-[80px] opacity-50" />
    </div>
    
    {/* Content */}
    <div className="relative z-10 flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#D0B2FF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          <span className="text-white/40 text-xs font-medium tracking-wider uppercase">Historical Data</span>
        </div>
        <div className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-semibold flex items-center gap-1">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7 14l5-5 5 5H7z"/>
          </svg>
          +127.4%
        </div>
      </div>
      
      {/* Backtest summary stats */}
      <div className="flex gap-2 mb-2">
        <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/5 text-center">
          <div className="text-white/40 text-[9px] uppercase">Period</div>
          <div className="text-white text-xs font-medium">2Y</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/5 text-center">
          <div className="text-white/40 text-[9px] uppercase">Max DD</div>
          <div className="text-[#E8400D] text-xs font-medium">-12.3%</div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/5 text-center">
          <div className="text-white/40 text-[9px] uppercase">CAGR</div>
          <div className="text-green-400 text-xs font-medium">48.2%</div>
        </div>
      </div>
      
      {/* Candlestick chart visualization */}
      <div className="relative h-32 px-2 py-2">
        <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="0" y1={i * 30 + 15} x2="300" y2={i * 30 + 15} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          ))}
          
          {/* Candlesticks */}
          {/* Candle 1 - Green */}
          <line x1="20" y1="30" x2="20" y2="90" stroke="#22c55e" strokeWidth="1" />
          <rect x="14" y="45" width="12" height="30" fill="#22c55e" rx="1" />
          
          {/* Candle 2 - Red */}
          <line x1="45" y1="35" x2="45" y2="85" stroke="#ef4444" strokeWidth="1" />
          <rect x="39" y="40" width="12" height="25" fill="#ef4444" rx="1" />
          
          {/* Candle 3 - Green */}
          <line x1="70" y1="25" x2="70" y2="80" stroke="#22c55e" strokeWidth="1" />
          <rect x="64" y="35" width="12" height="35" fill="#22c55e" rx="1" />
          
          {/* Candle 4 - Green */}
          <line x1="95" y1="20" x2="95" y2="70" stroke="#22c55e" strokeWidth="1" />
          <rect x="89" y="28" width="12" height="30" fill="#22c55e" rx="1" />
          
          {/* Candle 5 - Red */}
          <line x1="120" y1="25" x2="120" y2="75" stroke="#ef4444" strokeWidth="1" />
          <rect x="114" y="30" width="12" height="28" fill="#ef4444" rx="1" />
          
          {/* Candle 6 - Green */}
          <line x1="145" y1="22" x2="145" y2="68" stroke="#22c55e" strokeWidth="1" />
          <rect x="139" y="30" width="12" height="28" fill="#22c55e" rx="1" />
          
          {/* Candle 7 - Green */}
          <line x1="170" y1="15" x2="170" y2="60" stroke="#22c55e" strokeWidth="1" />
          <rect x="164" y="22" width="12" height="30" fill="#22c55e" rx="1" />
          
          {/* Candle 8 - Red */}
          <line x1="195" y1="18" x2="195" y2="55" stroke="#ef4444" strokeWidth="1" />
          <rect x="189" y="22" width="12" height="20" fill="#ef4444" rx="1" />
          
          {/* Candle 9 - Green */}
          <line x1="220" y1="12" x2="220" y2="50" stroke="#22c55e" strokeWidth="1" />
          <rect x="214" y="18" width="12" height="25" fill="#22c55e" rx="1" />
          
          {/* Candle 10 - Green big */}
          <line x1="245" y1="8" x2="245" y2="45" stroke="#22c55e" strokeWidth="1" />
          <rect x="239" y="12" width="12" height="28" fill="#22c55e" rx="1" />
          
          {/* Candle 11 - Current */}
          <line x1="270" y1="5" x2="270" y2="40" stroke="#D0B2FF" strokeWidth="1" />
          <rect x="264" y="10" width="12" height="22" fill="#D0B2FF" rx="1" />
          
          {/* Moving average line */}
          <path 
            d="M20 60 Q45 55, 70 45 T120 42 T170 30 T220 22 T270 18" 
            fill="none" 
            stroke="#E8400D" 
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />
        </svg>
        
        {/* Entry marker */}
        <div className="absolute top-[40%] left-[20%]">
          <div className="w-3 h-3 rounded-full bg-green-500/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          </div>
        </div>
        {/* Current position - small pulsing dot */}
        <div className="absolute top-[12%] right-[8%]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#D0B2FF] animate-pulse" />
        </div>
      </div>
      
      {/* Equity curve mini */}
      <div className="h-6 mb-2 px-2 flex items-center gap-2">
        <span className="text-white/30 text-[9px]">Equity</span>
        <div className="flex-1 h-full relative">
          <svg className="w-full h-full" viewBox="0 0 200 30" preserveAspectRatio="none">
            <path 
              d="M0 28 L20 25 L40 22 L60 24 L80 18 L100 15 L120 12 L140 14 L160 8 L180 5 L200 3" 
              fill="none" 
              stroke="url(#equityGrad)" 
              strokeWidth="2"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="equityGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D0B2FF" />
                <stop offset="100%" stopColor="#22c55e" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
      
      <div className="mt-auto">
        <h3 className="text-white text-2xl font-semibold tracking-tight">Backtesting</h3>
        <p className="text-white/50 text-sm mt-1">Validate before you trade</p>
      </div>
    </div>
  </div>
)

// Card 3 - Rich analytics dashboard
const Card3Visual = () => (
  <div className="relative w-full h-full overflow-hidden rounded-xl bg-[#0a0a0a]">
    {/* Gradient mesh */}
    <div className="absolute inset-0">
      <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[80%] h-[80%] rounded-full bg-[#FFEED8] blur-[100px] opacity-30" />
      <div className="absolute top-[-20%] left-[60%] w-[40%] h-[40%] rounded-full bg-[#E8400D] blur-[60px] opacity-40" />
      <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#D0B2FF] blur-[50px] opacity-40" />
    </div>
    
    {/* Content */}
    <div className="relative z-10 flex flex-col h-full p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#E8400D] animate-pulse" />
          <span className="text-white/40 text-xs font-medium tracking-wider uppercase">Live Analytics</span>
        </div>
        <span className="text-white/30 text-[10px]">Updated 2s ago</span>
      </div>
      
      {/* Mini line chart */}
      <div className="relative h-20 mb-4 px-2">
        <svg className="w-full h-full" viewBox="0 0 200 60" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="15" x2="200" y2="15" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="30" x2="200" y2="30" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          <line x1="0" y1="45" x2="200" y2="45" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          
          {/* Area fill */}
          <path 
            d="M0 50 L20 45 L40 48 L60 35 L80 38 L100 25 L120 30 L140 18 L160 22 L180 12 L200 15 L200 60 L0 60 Z" 
            fill="url(#areaGrad)" 
            opacity="0.3"
          />
          
          {/* Main line */}
          <path 
            d="M0 50 L20 45 L40 48 L60 35 L80 38 L100 25 L120 30 L140 18 L160 22 L180 12 L200 15" 
            fill="none" 
            stroke="url(#lineGrad)" 
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Dots at data points */}
          <circle cx="140" cy="18" r="3" fill="#E8400D" />
          <circle cx="180" cy="12" r="3" fill="#D0B2FF" />
          <circle cx="200" cy="15" r="4" fill="#FFEED8" stroke="#0a0a0a" strokeWidth="2" />
          
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D0B2FF" />
              <stop offset="50%" stopColor="#E8400D" />
              <stop offset="100%" stopColor="#FFEED8" />
            </linearGradient>
            <linearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E8400D" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#E8400D" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Current value indicator */}
        <div className="absolute -top-1 right-0 px-2 py-1 rounded bg-[#FFEED8]/20 backdrop-blur-sm">
          <span className="text-[#FFEED8] text-xs font-semibold">$42.8K</span>
        </div>
      </div>
      
      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-[10px] uppercase">Win Rate</span>
            <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z"/>
            </svg>
          </div>
          <div className="text-white text-lg font-semibold">73.2%</div>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div className="h-full w-[73%] bg-gradient-to-r from-[#E8400D] to-[#FFEED8] rounded-full" />
          </div>
        </div>
        <div className="p-3 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-white/40 text-[10px] uppercase">Sharpe</span>
            <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7 14l5-5 5 5H7z"/>
            </svg>
          </div>
          <div className="text-white text-lg font-semibold">2.41</div>
          <div className="w-full h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
            <div className="h-full w-[80%] bg-gradient-to-r from-[#D0B2FF] to-[#E8400D] rounded-full" />
          </div>
        </div>
      </div>
      
      {/* Additional metrics row */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
            </svg>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase">Trades</div>
            <div className="text-white text-sm font-medium">847</div>
          </div>
        </div>
        <div className="flex-1 p-2 rounded-lg bg-white/5 border border-white/5 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-[#E8400D]/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-[#E8400D]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z"/>
            </svg>
          </div>
          <div>
            <div className="text-white/40 text-[9px] uppercase">P&L</div>
            <div className="text-green-400 text-sm font-medium">+$12.4K</div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto">
        <h3 className="text-white text-2xl font-semibold tracking-tight">Analytics</h3>
        <p className="text-white/50 text-sm mt-1">Real-time performance</p>
      </div>
    </div>
    {/* Subtle noise texture */}
    <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
  </div>
)

export default function LD2CardSwapSection() {
  return (
    <section className="relative w-full bg-white py-24 my-16">
      <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12">
        {/* Left side - Text content */}
        <div className="flex-1 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-semibold text-black mb-6">
            Powerful <span className="italic font-serif">Trading</span> Tools
          </h2>
          <p className="text-lg text-black/60 mb-8">
            Build AI-powered trading agents, backtest your strategies on historical data, 
            and monitor performance with real-time analytics.
          </p>
          <ul className="space-y-4 text-black/70">
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              Automated trading strategies
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              Historical backtesting engine
            </li>
            <li className="flex items-center gap-3">
              <span className="w-2 h-2 bg-black rounded-full"></span>
              Real-time market analysis
            </li>
          </ul>
        </div>
        
        {/* Right side - CardSwap */}
        <div className="relative h-[500px] w-[400px] mr-12 md:mr-24">
          <CardSwap
            cardDistance={30}
            verticalDistance={60}
            delay={3000}
            pauseOnHover={false}
          >
            <Card>
              <Card1Visual />
            </Card>
            <Card>
              <Card2Visual />
            </Card>
            <Card>
              <Card3Visual />
            </Card>
          </CardSwap>
        </div>
      </div>
    </section>
  )
}
