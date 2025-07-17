export interface WeatherLayer {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  opacity: number;
  enabled: boolean;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  visibility: number;
  condition: string;
  precipitation: number;
}