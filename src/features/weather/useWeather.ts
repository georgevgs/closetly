import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";

export type WeatherSnapshot = {
  tempC: number;
  precipProb: number;
  weatherCode: number;
  summary: string;
};

export type CoarseCoords = {
  lat: number;
  lon: number;
};

const WEATHER_CODES: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Heavy drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  80: "Showers",
  81: "Showers",
  82: "Heavy showers",
  95: "Thunderstorm",
};

// 0.1° ≈ 11km. Coarse enough that pacing around the block doesn't refetch,
// fine enough that crossing into a different microclimate (or city) does.
// The previous queryKey was a fixed string, so a user travelling kept seeing
// stale weather for up to 30 minutes after arrival.
const COORDS_BUCKET = 0.1;
const COORDS_STALE_MS = 5 * 60 * 1000;
const FORECAST_STALE_MS = 30 * 60 * 1000;
const NOOP_FORECAST_KEY = ["weather", "forecast", "noop"] as const;

export const weatherKeys = {
  all: ["weather"] as const,
  coords: ["weather", "coords"] as const,
  forecast: (lat: number, lon: number) =>
    ["weather", "forecast", lat, lon] as const,
};

export function useCoarseCoords() {
  return useQuery<CoarseCoords | null>({
    queryKey: weatherKeys.coords,
    staleTime: COORDS_STALE_MS,
    queryFn: fetchCoarseCoords,
  });
}

export function useWeather() {
  const { data: coords } = useCoarseCoords();
  return useQuery<WeatherSnapshot | null>({
    queryKey: forecastKeyFor(coords),
    enabled: coords !== null && coords !== undefined,
    staleTime: FORECAST_STALE_MS,
    queryFn: async () => {
      if (!coords) return null;
      return fetchForecast(coords);
    },
  });
}

const fetchCoarseCoords = async (): Promise<CoarseCoords | null> => {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) return null;

  const lastKnown = await Location.getLastKnownPositionAsync({});
  const coords = await resolveCoords(lastKnown);
  return {
    lat: roundToBucket(coords.latitude),
    lon: roundToBucket(coords.longitude),
  };
};

const resolveCoords = async (
  lastKnown: Location.LocationObject | null,
): Promise<Location.LocationObjectCoords> => {
  if (lastKnown) return lastKnown.coords;
  const current = await Location.getCurrentPositionAsync({});
  return current.coords;
};

const fetchForecast = async (coords: CoarseCoords): Promise<WeatherSnapshot> => {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set(
    "current",
    "temperature_2m,precipitation_probability,weather_code",
  );
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error("Weather fetch failed");
  const data = await response.json();
  return parseForecast(data.current);
};

const parseForecast = (current: {
  temperature_2m: number;
  precipitation_probability: number | null;
  weather_code: number;
}): WeatherSnapshot => {
  const code = current.weather_code;
  return {
    tempC: current.temperature_2m,
    precipProb: precipFractionFor(current.precipitation_probability),
    weatherCode: code,
    summary: summaryFor(code),
  };
};

const precipFractionFor = (raw: number | null): number => {
  if (raw === null) return 0;
  return raw / 100;
};

const summaryFor = (code: number): string => {
  const known = WEATHER_CODES[code];
  if (known === undefined) return "—";
  return known;
};

const forecastKeyFor = (coords: CoarseCoords | null | undefined) => {
  if (!coords) return NOOP_FORECAST_KEY;
  return weatherKeys.forecast(coords.lat, coords.lon);
};

const roundToBucket = (value: number): number => {
  return Math.round(value / COORDS_BUCKET) * COORDS_BUCKET;
};
