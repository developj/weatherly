import { WeatherData } from "@/types/Weather";

export async function fetchWeatherData(lat: number, lon: number, apiKey: string): Promise<WeatherData | null> {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      temperature: data.main.temp,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      windDirection: data.wind.deg,
      pressure: data.main.pressure,
      visibility: (data.visibility ?? 10000) / 1000, // in km
      condition: data.weather[0]?.main ?? "Unknown",
      precipitation: (data.rain?.["1h"] || data.snow?.["1h"] || 0),
    };
  } catch (e) {
    console.error("Failed to fetch weather:", e);
    return null;
  }
}

