interface WeatherMain {
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
}

interface WeatherDescription {
  id: number;
  main: string;
  description: string;
  icon: string;
}

interface Wind {
  speed: number;
  deg: number;
  gust: number;
}

interface Rain {
  "3h"?: number; // Rain volume for last 3 hours, optional
}

interface ForecastEntry {
  dt: number;
  main: WeatherMain;
  weather: WeatherDescription[];
  wind: Wind;
  visibility: number;
  pop: number; // Probability of precipitation
  rain?: Rain; // Optional rain object
  sys: { pod: string };
  dt_txt: string;
}

interface OpenWeatherMapForecast {
  cod: string;
  message: number;
  cnt: number;
  list: ForecastEntry[];
  city: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

interface TransformedForecastData {
  dt: number;
  time: string;
  temp: number;
  feels_like: number;
  humidity: number;
  pressure: number;
  pop: number;
  rain: number;
  wind_speed: number;
  weather: string;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#FFBB28", "#00C49F"];

export type {
  OpenWeatherMapForecast,
  ForecastEntry,
  TransformedForecastData,
  WeatherMain,
  WeatherDescription,
  Wind,
  Rain,
};
export { COLORS };
