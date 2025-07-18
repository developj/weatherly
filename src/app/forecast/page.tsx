"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import WeatherForecastDashboard from "@/components/WeatherForecast/WeatherForecastDashboard";
import { Card, Input, Button, Switch, Select, message } from "antd";
import Link from "next/link";
import { Layers } from "lucide-react";

interface OpenWeatherMapForecast {
  cod: string;
  message: number;
  cnt: number;
  list: any[];
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

const DEFAULT_CITY = "Helsinki";
const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

const FREQUENCY_OPTIONS = [
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
] as const;

const WeatherPage = () => {
  const [input, setInput] = useState(DEFAULT_CITY);
  const [location, setLocation] = useState(DEFAULT_CITY);
  const [frequency, setFrequency] = useState<
    "hourly" | "daily" | "weekly" | "monthly" | "yearly"
  >("hourly");
  const [forecast, setForecast] = useState<OpenWeatherMapForecast | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch forecast
  const fetchForecast = async (city: string) => {
    setLoading(true);
    try {
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${OWM_API_KEY}&units=metric`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("City not found");
      const data = await res.json();
      setForecast(data);
      setLocation(city);
    } catch (err: any) {
      message.error(err.message || "Error fetching forecast");
      setForecast(null);
    }
    setLoading(false);
  };

  // Load default on mount
  useEffect(() => {
    fetchForecast(DEFAULT_CITY);
    // eslint-disable-next-line
  }, []);

  // Sidebar UI
  const sider = (
    <Card
      title={
        <span
          className="flex items-center gap-2 text-lg"
          style={{
            color: "#EFF5FF",
          }}
        >
          <Layers className="h-5 w-5" />
          Weather Control Center
        </span>
      }
      style={{
        margin: "16px auto",
        width: 300,
        backdropFilter: "blur(3px)",
        background: "#1C2951",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 0 32px 0 #0009",
      }}
    >
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter city"
        onPressEnter={() => fetchForecast(input)}
        style={{ marginBottom: 8, fontWeight: 700 }}
      />
      <Button
        type="primary"
        block
        onClick={() => fetchForecast(input)}
        loading={loading}
        style={{ marginBottom: 16 }}
      >
        Search
      </Button>

      <div className="w-full mb-4">
        <Link href="/" className="w-full">
          <Button
            style={{
              background: "#F59E0B",
              color: "#1C2951",
              borderRadius: 8,
              height: 45,
              width: "100%",
              border: "none",
            }}
            shape="default"
            className="w-full text-center py-2"
          >
            View in Map
          </Button>
        </Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Select
          value={frequency}
          onChange={setFrequency}
          options={[...FREQUENCY_OPTIONS]}
          style={{ width: "100%", zIndex: 3400, height: 40 }}
          styles={
            {
              popup: {
                root: {
                  background: "#fff",
                  color: "#EFF5FF",
                  border: "1px solid #555",
                  zIndex: 3400,
                  borderRadius: 8,
                },
              },
            } // Darker popup styles
          }
        />
      </div>
      {forecast && (
        <div style={{ color: "#D3D8FF", marginTop: 16 }}>
          <b>Location:</b> {forecast.city.name}, {forecast.city.country}
          <br />
          <b>Timezone:</b> GMT {forecast.city.timezone / 3600}
        </div>
      )}
    </Card>
  );

  return (
    <AppLayout zIndexSider={3000} sider={sider}>
      {forecast ? (
        <WeatherForecastDashboard forecast={forecast} frequency={frequency} />
      ) : (
        <Card>Search a city to view forecast</Card>
      )}
    </AppLayout>
  );
};

export default WeatherPage;
