import type { WeatherSnapshot } from "~/features/weather/useWeather";
import type { WeatherContext } from "~/lib/outfit/score";

// Above this probability we treat the day as "rainy" for outfit decisions.
const PRECIP_THRESHOLD = 0.4;

export const toWeatherContext = (
  snapshot: WeatherSnapshot | null | undefined,
): WeatherContext | undefined => {
  if (!snapshot) return undefined;
  return { tempC: snapshot.tempC, precip: snapshot.precipProb > PRECIP_THRESHOLD };
};
