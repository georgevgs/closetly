import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";

export type WeatherSnapshot = {
  tempC: number;
  precipProb: number;
  weatherCode: number;
  summary: string;
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

export const weatherKeys = {
  current: ["weather", "current"] as const,
};

export function useWeather() {
  return useQuery({
    queryKey: weatherKeys.current,
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<WeatherSnapshot | null> => {
      const perm = await Location.getForegroundPermissionsAsync();
      if (!perm.granted) return null;

      const lastKnown = await Location.getLastKnownPositionAsync({});
      const coords =
        lastKnown?.coords ?? (await Location.getCurrentPositionAsync({})).coords;

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(coords.latitude));
      url.searchParams.set("longitude", String(coords.longitude));
      url.searchParams.set(
        "current",
        "temperature_2m,precipitation_probability,weather_code",
      );
      url.searchParams.set("timezone", "auto");

      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Weather fetch failed");
      const data = await response.json();
      const current = data.current;
      const code = current.weather_code as number;
      return {
        tempC: current.temperature_2m,
        precipProb: (current.precipitation_probability ?? 0) / 100,
        weatherCode: code,
        summary: WEATHER_CODES[code] ?? "—",
      };
    },
  });
}
