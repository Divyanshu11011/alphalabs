// Chart Types

export interface CandleData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EquityCurvePoint {
  time: number;
  value: number;
  drawdown?: number;
}

export interface TradeMarker {
  time: number;
  position: "above" | "below";
  type: "entry-long" | "entry-short" | "exit-profit" | "exit-loss";
  price: number;
  label?: string;
}

export interface ChartConfig {
  height?: number;
  showVolume?: boolean;
  showGrid?: boolean;
  theme?: "dark" | "light";
  colors?: ChartColors;
}

export interface ChartColors {
  background: string;
  grid: string;
  text: string;
  bullish: string;
  bearish: string;
  volume: string;
  equity: string;
  drawdown: string;
}

export interface IndicatorValue {
  name: string;
  value: number;
  color?: string;
}

export interface ChartOverlay {
  type: "line" | "area" | "histogram";
  data: { time: number; value: number }[];
  color: string;
  label: string;
}

