"use client";

import { useEffect, useRef, memo } from "react";
import { useTheme } from "next-themes";
import {
  createChart,
  ColorType,
  CrosshairMode,
  AreaSeries,
  LineSeries,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";
import type { EquityCurvePoint } from "@/types";

interface EquityCurveChartProps {
  data: EquityCurvePoint[];
  height?: number;
  showDrawdown?: boolean;
  startingCapital?: number;
}

// Theme-aware color configuration (matching candlestick-chart)
function getChartColors(isDark: boolean) {
  return {
    textColor: isDark ? "#e4e4e7" : "#3f3f46", // zinc-200 for dark, zinc-700 for light
    gridColor: isDark ? "rgba(63, 63, 70, 0.3)" : "rgba(228, 228, 231, 0.5)",
    borderColor: isDark ? "rgba(82, 82, 91, 0.5)" : "rgba(212, 212, 216, 0.7)",
    lineColor: "#10b981", // primary emerald
    areaTopColor: "rgba(0, 212, 255, 0.3)",
    areaBottomColor: "rgba(0, 212, 255, 0.05)",
    baselineColor: isDark ? "rgba(161, 161, 170, 0.5)" : "rgba(113, 113, 122, 0.5)",
    drawdownColor: "rgba(239, 68, 68, 0.4)", // red
  };
}

function EquityCurveChartComponent({
  data,
  height = 300,
  showDrawdown = true,
  startingCapital = 10000,
}: EquityCurveChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const { resolvedTheme } = useTheme();
  
  const isDark = resolvedTheme === "dark" || resolvedTheme === undefined;

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const colors = getChartColors(isDark);

    // Create chart with theme-aware colors
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: colors.textColor,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: colors.gridColor },
        horzLines: { color: colors.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: `${colors.lineColor}80`,
          labelBackgroundColor: colors.lineColor,
        },
        horzLine: {
          color: `${colors.lineColor}80`,
          labelBackgroundColor: colors.lineColor,
        },
      },
      rightPriceScale: {
        borderColor: colors.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: showDrawdown ? 0.3 : 0.1,
        },
      },
      timeScale: {
        borderColor: colors.borderColor,
        timeVisible: true,
      },
    });

    // Equity area series - v5 API with theme-aware colors
    const equitySeries = chart.addSeries(AreaSeries, {
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `$${price.toLocaleString()}`,
      },
    });

    // Starting capital baseline - v5 API
    const baselineSeries = chart.addSeries(LineSeries, {
      color: colors.baselineColor,
      lineWidth: 1,
      lineStyle: 2,
      priceLineVisible: false,
      lastValueVisible: false,
    });

    // Drawdown histogram (if enabled) - v5 API
    let drawdownSeries: ISeriesApi<"Histogram"> | null = null;
    if (showDrawdown) {
      drawdownSeries = chart.addSeries(HistogramSeries, {
        color: colors.drawdownColor,
        priceFormat: {
          type: "custom",
          formatter: (price: number) => `${price.toFixed(1)}%`,
        },
        priceScaleId: "drawdown",
      });
      drawdownSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });
    }

    // Set data
    if (data.length > 0) {
      const equityData = data.map((d) => ({
        time: (d.time / 1000) as Time,
        value: d.value,
      }));
      equitySeries.setData(equityData);

      // Baseline
      const baselineData = data.map((d) => ({
        time: (d.time / 1000) as Time,
        value: startingCapital,
      }));
      baselineSeries.setData(baselineData);

      // Drawdown
      if (drawdownSeries && showDrawdown) {
        const drawdownData = data
          .filter((d) => d.drawdown !== undefined)
          .map((d) => ({
            time: (d.time / 1000) as Time,
            value: d.drawdown || 0,
            color: colors.drawdownColor,
          }));
        drawdownSeries.setData(drawdownData);
      }

      chart.timeScale().fitContent();
    }

    chartRef.current = chart;

    // Resize handler
    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, [data, showDrawdown, startingCapital, isDark]);

  return (
    <div
      ref={chartContainerRef}
      style={{ height }}
      className="w-full rounded-lg bg-card/30"
    />
  );
}

export const EquityCurveChart = memo(EquityCurveChartComponent);
