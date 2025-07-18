"use client";
import React from "react";
import { Card, Row, Col } from "antd";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer,
} from "recharts";
import { useMediaQuery } from "react-responsive";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
dayjs.extend(isoWeek);

// ---- Types ----
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ForecastEntry = any; 
export interface OpenWeatherMapForecast {
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

type TransformedForecastData = {
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
};

const COLORS = [
  "#8884d8", "#82ca9d", "#FFBB28", "#ff8042", "#0088FE", "#00C49F", "#A28CFF", "#FF6666", "#A1B56C"
];

const formatTime = (dt_txt: string) =>
  new Date(dt_txt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const formatDate = (dt_txt: string) =>
  new Date(dt_txt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

const groupBy = <T, K extends string | number>(arr: T[], keyFn: (item: T) => K) =>
  arr.reduce((acc, item) => {
    const key = keyFn(item);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<K, T[]>);

const getWeatherFrequency = (list: ForecastEntry[]) => {
  const freq: Record<string, number> = {};
  list.forEach((entry) => {
    const main = entry.weather?.[0]?.main ?? "Other";
    freq[main] = (freq[main] ?? 0) + 1;
  });
  return Object.entries(freq).map(([name, value]) => ({ name, value }));
};

type WeatherForecastDashboardProps = {
  forecast: OpenWeatherMapForecast;
  frequency: "hourly" | "daily" | "weekly" | "monthly" | "yearly";
};

const WeatherForecastDashboard: React.FC<WeatherForecastDashboardProps> = ({ forecast, frequency }) => {
  const isMobile = useMediaQuery({ maxWidth: 767 });

  if (!forecast || !forecast.list) return null;

  let data: TransformedForecastData[] = forecast.list.map((d: ForecastEntry) => ({
    dt: d.dt,
    time: formatTime(d.dt_txt),
    temp: Math.round(d.main.temp),
    feels_like: Math.round(d.main.feels_like),
    humidity: d.main.humidity,
    pressure: d.main.pressure,
    pop: Math.round((d.pop || 0) * 100),
    rain: d.rain?.["3h"] || 0,
    wind_speed: d.wind.speed,
    weather: d.weather?.[0]?.main,
  }));

  // Grouping for daily/weekly/monthly/yearly
  if (frequency !== "hourly") {
    let groupFn: (d: ForecastEntry) => string | number;
    let labelFn: ((d: ForecastEntry) => string) | ((items: ForecastEntry[]) => string);

    if (frequency === "daily") {
      groupFn = (d: ForecastEntry) => formatDate(d.dt_txt);
      labelFn = (d: ForecastEntry) => formatDate(d.dt_txt); // Corrected type
    } else if (frequency === "weekly") {
      groupFn = (d: ForecastEntry) => dayjs(d.dt_txt).isoWeek();
      labelFn = (items: ForecastEntry[]) => {
        const first = dayjs(items[0].dt_txt);
        return "Week " + first.isoWeek() + " (" + first.format("MMM D") + ")";
      };
    } else if (frequency === "monthly") {
      groupFn = (d: ForecastEntry) => dayjs(d.dt_txt).format("YYYY-MM");
      labelFn = (items: ForecastEntry[]) => dayjs(items[0].dt_txt).format("MMM YYYY");
    } else if (frequency === "yearly") {
      groupFn = (d: ForecastEntry) => dayjs(d.dt_txt).format("YYYY");
      labelFn = (items: ForecastEntry[]) => dayjs(items[0].dt_txt).format("YYYY");
    } else {
        // Fallback for when frequency might not strictly match, though typed above
        groupFn = (d: ForecastEntry) => formatDate(d.dt_txt);
        labelFn = (d: ForecastEntry) => formatDate(d.dt_txt);
    }

    const grouped = groupBy(forecast.list, groupFn);
    data = Object.values(grouped).map((items: ForecastEntry[]) => {
      const n = items.length;
      return {
        dt: items[0].dt,
        time: (typeof labelFn === "function" && frequency === "daily")
                ? (labelFn as (d: ForecastEntry) => string)(items[0])
                : (labelFn as (items: ForecastEntry[]) => string)(items),
        temp: Math.round(items.reduce((sum, d) => sum + d.main.temp, 0) / n),
        feels_like: Math.round(items.reduce((sum, d) => sum + d.main.feels_like, 0) / n),
        humidity: Math.round(items.reduce((sum, d) => sum + d.main.humidity, 0) / n),
        pressure: Math.round(items.reduce((sum, d) => sum + d.main.pressure, 0) / n),
        pop: Math.round(items.reduce((sum, d) => sum + (d.pop || 0) * 100, 0) / n),
        rain: Number((items.reduce((sum, d) => sum + (d.rain?.["3h"] || 0), 0) / n).toFixed(1)),
        wind_speed: Number((items.reduce((sum, d) => sum + d.wind.speed, 0) / n).toFixed(1)),
        weather: items[0].weather?.[0]?.main ?? "Other",
      };
    });
  }

  const minTemp = Math.min(...data.map(d => d.temp));
  const maxTemp = Math.max(...data.map(d => d.temp));
  const maxPop = Math.max(...data.map(d => d.pop));
  const maxHumidity = Math.max(...data.map(d => d.humidity));
  const weatherTypes = getWeatherFrequency(forecast.list);

  return (
    <div style={{ width: "100%" }}>
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}><Card title="Min Temp">{minTemp}°C</Card></Col>
        <Col xs={12} sm={6}><Card title="Max Temp">{maxTemp}°C</Card></Col>
        <Col xs={12} sm={6}><Card title="Max Precip">{maxPop}%</Card></Col>
        <Col xs={12} sm={6}><Card title="Max Humidity">{maxHumidity}%</Card></Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24}>
          <Card title="Temperature & Feels Like (°C)">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data}>
                <XAxis
                  dataKey="time"
                  interval={isMobile ? "preserveStartEnd" : 2}
                  minTickGap={isMobile ? 24 : 8}
                  tick={{ fontSize: isMobile ? 10 : 12 }}
                />
                <YAxis domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Area type="monotone" dataKey="temp" stroke="#8884d8" fillOpacity={0.5} fill="#8884d8" name="Temp" />
                <Area type="monotone" dataKey="feels_like" stroke="#82ca9d" fillOpacity={0.25} fill="#82ca9d" name="Feels Like" />
                {!isMobile && <Legend />}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Humidity (%)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <XAxis dataKey="time" interval={isMobile ? "preserveStartEnd" : 2} minTickGap={isMobile ? 24 : 8} tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="humidity" stroke="#0088FE" />
                {!isMobile && <Legend />}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]} style={{ marginTop: 32 }}>
        <Col xs={24}>
          <Card title="Precipitation Probability & Rain (mm/3h)">
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data}>
                <XAxis dataKey="time" interval={isMobile ? "preserveStartEnd" : 2} minTickGap={isMobile ? 24 : 8} tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis yAxisId="left" domain={[0, 100]} />
                <YAxis yAxisId="right" orientation="right" domain={[0, Math.max(...data.map(d => d.rain), 5)]} />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Bar yAxisId="left" dataKey="pop" fill="#FFBB28" name="Precip. Probability (%)" />
                <Bar yAxisId="right" dataKey="rain" fill="#00C49F" name="Rain (mm)" />
                {!isMobile && <Legend />}
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title="Wind Speed (m/s)">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data}>
                <XAxis dataKey="time" interval={isMobile ? "preserveStartEnd" : 2} minTickGap={isMobile ? 24 : 8} tick={{ fontSize: isMobile ? 10 : 12 }} />
                <YAxis />
                <Tooltip />
                <CartesianGrid strokeDasharray="3 3" />
                <Line type="monotone" dataKey="wind_speed" stroke="#ff8042" />
                {!isMobile && <Legend />}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
      <Row style={{ marginTop: 32 }}>
        <Col xs={24}>
          <Card title="Weather Type Frequency">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={weatherTypes}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={isMobile ? 70 : 90}
                  label={!isMobile}
                >
                  {weatherTypes.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                {!isMobile && <Legend />}
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WeatherForecastDashboard;