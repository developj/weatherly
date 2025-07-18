"use client";
import React, { useState, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import WeatherForecastDashboard from "@/components/WeatherForecast/WeatherForecastDashboard";
import { Card, Input, Button, Switch, Select, message } from "antd";
import Link from "next/link";
import { Layers, Search } from "lucide-react";

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

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

const FREQUENCY_OPTIONS = [
  { label: "Hourly", value: "hourly" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
] as const;

// Animated SVG Loader
const WeatherLoader = () => (
  <div className="flex flex-col items-center justify-center py-12 h-96">
    <svg width="100%" height="120" viewBox="0 0 80 80" fill="none" className="animate-spin-slow">
      <circle cx="40" cy="40" r="30" fill="#38BDF8" opacity="0.4" />
      <ellipse cx="40" cy="52" rx="24" ry="12" fill="#fff" opacity="0.9" />
      <ellipse cx="54" cy="36" rx="12" ry="8" fill="#FACC15" opacity="0.8" />
      <circle cx="33" cy="45" r="4" fill="#FDE68A" />
    </svg>
    <div className="mt-6 text-lg font-semibold text-[#1C2951]">Loading weather data…</div>
    <style>
      {`
      .animate-spin-slow {
        animation: spin 2.2s linear infinite;
      }
      @keyframes spin {
        100% { transform: rotate(360deg); }
      }
      `}
    </style>
  </div>
);

// No Result State
const NoWeatherResult = ({ city }: { city: string }) => (
  <div className="flex flex-col items-center justify-center py-12 h-96">
    <svg width="100%" height="100" viewBox="0 0 60 60" fill="none">
      <ellipse cx="30" cy="40" rx="20" ry="10" fill="#dbeafe" />
      <ellipse cx="40" cy="34" rx="8" ry="4" fill="#fef9c3" />
      <path d="M15 44 Q 30 30 45 44" stroke="#94a3b8" strokeWidth="2" fill="none" />
    </svg>
    <div className="mt-4 text-md text-[#1C2951]">No forecast found for <span className="font-bold">{city}</span></div>
    <div className="mt-1 text-xs text-gray-400">Try searching for another location.</div>
  </div>
);

const WeatherPage = () => {
  const DEFAULT_CITY = "Helsinki";
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
    const savedCity = localStorage.getItem("city") || DEFAULT_CITY;
    setInput(savedCity);
    setLocation(savedCity);
    fetchForecast(savedCity);
    // eslint-disable-next-line
  }, []);

  // Sidebar UI
  const sider = (
    <Card
      title={
        <Link
          href="/"
          className="flex items-center gap-2 group cursor-pointer no-underline"
        >
          <svg width="38" height="38" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="20" fill="#38BDF8" />
            <ellipse cx="24" cy="30" rx="11" ry="7" fill="#fff" />
            <ellipse cx="28" cy="22" rx="6" ry="4" fill="#FACC15" />
            <circle cx="19" cy="25" r="3" fill="#FDE68A" />
          </svg>
          <span className="text-lg font-bold text-white ">Weatherly</span>
        </Link>
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
      <label className="text-sm font-medium" style={{ color: "#EFF5FF" }}>
        Search Location
      </label>
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter city"
        onPressEnter={() => {
          localStorage.setItem("city", input);
          fetchForecast(input);
        }}
        style={{ marginBottom: 8, fontWeight: 700 }}
      />
      <Button
        type="primary"
        block
        onClick={() => {
          localStorage.setItem("city", input);
          fetchForecast(input);
        }}
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
          dropdownStyle={{
            background: "#fff",
            color: "#1C2951",
            border: "1px solid #555",
            zIndex: 3400,
            borderRadius: 8,
          }}
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
    <AppLayout
      header={
        <div className="flex items-center">
          <Input
            value={input}
            type="text"
            placeholder="Enter city or address"
            onChange={(e) => setInput(e.target.value)}
            onPressEnter={() => {
              localStorage.setItem("city", input);
              fetchForecast(input);
            }}
            style={{
              flex: 1,
              margin: "8px 12px",
              marginRight: 0,
              background: "#fff",
              border: "1px solid #666",
              color: "#1C2951",
              fontWeight: 700,
              marginBottom: 8,
            }}
          />{" "}
          <Button
            shape="round"
            type="text"
            onClick={() => {
              localStorage.setItem("city", input);
              fetchForecast(input);
            }}
            loading={loading}
          >
            {<Search color="#fff" />}
          </Button>
        </div>
      }
      zIndexSider={3000}
      sider={sider}
    >
      {loading ? (
        <Card styles={{ body: { padding: 0 } }}>
          <WeatherLoader />
        </Card>
      ) : forecast ? (
        <WeatherForecastDashboard forecast={forecast} frequency={frequency} />
      ) : (
        <Card styles={{ body: { padding: 0 } }}>
          <NoWeatherResult city={input} />
        </Card>
      )}
    </AppLayout>
  );
};

export default WeatherPage;
