import { useMemo } from "react";
import {
  useCoarseCoords,
  useWeather,
  type CoarseCoords,
  type WeatherSnapshot,
} from "~/features/weather/useWeather";
import { activeSeasonsFor, calendarSeasonFor, seasonKeyFor } from "~/lib/seasons";
import type { Season } from "~/types/items";

export type ActiveSeasons = {
  activeSeasons: Season[];
  calendarSeason: Season;
  seasonKey: string;
  tempC: number | null;
};

export const useActiveSeasons = (): ActiveSeasons => {
  const { data: coords } = useCoarseCoords();
  const { data: weather } = useWeather();
  const latitude = latitudeOrNull(coords);
  const tempC = tempOrNull(weather);

  return useMemo(() => {
    const date = new Date();
    return {
      activeSeasons: activeSeasonsFor({ date, latitude, tempC }),
      calendarSeason: calendarSeasonFor(date, latitude),
      seasonKey: seasonKeyFor(date, latitude),
      tempC,
    };
  }, [latitude, tempC]);
};

const latitudeOrNull = (coords: CoarseCoords | null | undefined): number | null => {
  if (!coords) return null;
  return coords.lat;
};

const tempOrNull = (weather: WeatherSnapshot | null | undefined): number | null => {
  if (!weather) return null;
  return weather.tempC;
};
