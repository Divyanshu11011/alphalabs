import { useApiClient } from "@/lib/api";
import { useCallback, useEffect, useState } from "react";

export interface AssetOption {
  id: string;
  name: string;
  icon?: string;
  available: boolean;
}

export interface TimeframeOption {
  id: string;
  name: string;
  minutes: number;
}

export interface DatePresetOption {
  id: string;
  name: string;
  description?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
}

export interface PlaybackSpeedOption {
  id: string;
  name: string;
  ms: number;
}

interface CatalogState {
  assets: AssetOption[];
  timeframes: TimeframeOption[];
  datePresets: DatePresetOption[];
  playbackSpeeds: PlaybackSpeedOption[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useArenaCatalogs(): CatalogState {
  const { get } = useApiClient();
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [timeframes, setTimeframes] = useState<TimeframeOption[]>([]);
  const [datePresets, setDatePresets] = useState<DatePresetOption[]>([]);
  const [playbackSpeeds, setPlaybackSpeeds] = useState<PlaybackSpeedOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [assetRes, timeframeRes, presetRes] = await Promise.all([
        get<{ assets: Array<{ id: string; name: string; icon?: string; available: boolean }> }>(
          "/api/data/assets"
        ),
        get<{ timeframes: Array<{ id: string; name: string; minutes: number }> }>(
          "/api/data/timeframes"
        ),
        get<{ date_presets: Array<any>; playback_speeds: Array<any> }>("/api/data/presets"),
      ]);

      setAssets(
        assetRes.assets.filter((asset) => asset.available).map((asset) => ({
          id: asset.id,
          name: asset.name,
          icon: asset.icon,
          available: asset.available,
        }))
      );

      setTimeframes(
        timeframeRes.timeframes.map((tf) => ({
          id: tf.id,
          name: tf.name,
          minutes: tf.minutes,
        }))
      );

      setDatePresets(
        presetRes.date_presets.map((preset) => ({
          id: preset.id,
          name: preset.name,
          description: preset.description,
          days: preset.days,
          startDate: preset.start_date,
          endDate: preset.end_date,
        }))
      );

      setPlaybackSpeeds(
        presetRes.playback_speeds.map((speed) => ({
          id: speed.id,
          name: speed.name,
          ms: speed.ms,
        }))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load arena catalogs";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [get]);

  useEffect(() => {
    void fetchCatalogs();
  }, [fetchCatalogs]);

  return {
    assets,
    timeframes,
    datePresets,
    playbackSpeeds,
    isLoading,
    error,
    refresh: fetchCatalogs,
  };
}

