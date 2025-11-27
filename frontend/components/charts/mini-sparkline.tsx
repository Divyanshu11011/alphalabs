"use client";

import { useEffect, useRef, memo } from "react";
import {
  createChart,
  ColorType,
  AreaSeries,
  type IChartApi,
  type Time,
} from "lightweight-charts";

interface MiniSparklineProps {
  data: { time: number; value: number }[];
  width?: number;
  height?: number;
  color?: "green" | "red" | "cyan";
  showLastValue?: boolean;
}

function MiniSparklineComponent({
  data,
  width = 100,
  height = 40,
  color = "cyan",
  showLastValue = false,
}: MiniSparklineProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const colorMap = {
    green: "hsl(142 76% 36%)",
    red: "hsl(0 84% 60%)",
    cyan: "hsl(190 100% 50%)",
  };

  useEffect(() => {
    if (!chartContainerRef.current || data.length === 0) return;

    const chart = createChart(chartContainerRef.current, {
      width,
      height,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "transparent",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { visible: false },
      },
      handleScale: false,
      handleScroll: false,
    });

    // v5 API
    const series = chart.addSeries(AreaSeries, {
      lineColor: colorMap[color],
      topColor: colorMap[color].replace(")", " / 0.2)"),
      bottomColor: "transparent",
      lineWidth: 1,
      priceLineVisible: false,
      lastValueVisible: showLastValue,
    });

    const lineData = data.map((d) => ({
      time: (d.time / 1000) as Time,
      value: d.value,
    }));

    series.setData(lineData);
    chart.timeScale().fitContent();

    chartRef.current = chart;

    return () => {
      chart.remove();
    };
  }, [data, width, height, color, showLastValue]);

  return <div ref={chartContainerRef} className="inline-block" />;
}

export const MiniSparkline = memo(MiniSparklineComponent);
