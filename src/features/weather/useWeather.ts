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

export function useWeather() {
  return useQuery({
    queryKey: ["weather", "current"],
    staleTime: 30 * 60 * 1000,
    queryFn: async (): Promise<WeatherSnapshot | null> => {
      const perm = await Location.getForegroundPermissionsAsync();
      let granted = perm.granted;
      if (!granted && perm.canAskAgain) {
        const req = await Location.requestForegroundPermissionsAsync();
        granted = req.granted;
      }
      if (!granted) return null;

      const loc = await Location.getLastKnownPositionAsync({});
      const coords =
        loc?.coords ?? (await Location.getCurrentPositionAsync({})).coords;

      const url = new URL("https://api.open-meteo.com/v1/forecast");
      url.searchParams.set("latitude", String(coords.latitude));
      url.searchParams.set("longitude", String(coords.longitude));
      url.searchParams.set(
        "current",
        "temperature_2m,precipitation_probability,weather_code"
      );
      url.searchParams.set("timezone", "auto");

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Weather fetch failed");
      const data = await res.json();
      const c = data.current;
      const code = c.weather_code as number;
      return {
        tempC: c.temperature_2m,
        precipProb: (c.precipitation_probability ?? 0) / 100,
        weatherCode: code,
        summary: WEATHER_CODES[code] ?? "—",
      };
    },
  });
}
