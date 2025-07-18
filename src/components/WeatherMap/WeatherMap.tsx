"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { WeatherData, WeatherLayer } from "@/types/Weather";
import WeatherLegend from "./WeatherLegend";
import { fetchWeatherData } from "@/actions/weather";
import Link from "next/link";
import AppLayout from "../AppLayout";
import {
  Button,
  Card,
  Input,
  Select,
  Slider,
  Switch,
  Badge,
  InputRef,
} from "@/components"; // Your AntD wrappers
import {
  Cloud,
  CloudRain,
  Sun,
  Snowflake,
  Wind,
  Thermometer,
  Eye,
  Droplets,
  Gauge,
  Zap,
  Layers,
  MapPin,
  RefreshCw,
  Search,
} from "lucide-react";

// API KEYS
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const weatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "";

// TILE MAPS
const WEATHER_TILE_MAPS: Record<string, string> = {
  temperature: "temp_new",
  precipitation: "precipitation_new",
  wind: "wind_new",
  pressure: "pressure_new",
  clouds: "clouds_new",
  lightning: "lightning_new",
  snow: "snow_new",
};

// Layer desc
const getLayerDescription = (id: string, name: string) => {
  switch (id) {
    case "precipitation": return "Rain/Snow Intensity";
    case "temperature": return "Temperature (blue=cold, red=hot)";
    case "wind": return "Wind Speed";
    case "pressure": return "Atmospheric Pressure";
    case "clouds": return "Cloud Coverage";
    case "lightning": return "Lightning Strikes";
    case "snow": return "Snow Cover";
    default: return name;
  }
};

const WeatherMap = () => {
  const [searchText, setSearchText] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const overlayRefs = useRef<Record<string, google.maps.ImageMapType | null>>({});
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<string>("roadmap");
  const [currentLocation, setCurrentLocation] = useState<google.maps.LatLng | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 0,
    humidity: 0,
    windSpeed: 0,
    windDirection: 0,
    pressure: 0,
    visibility: 0,
    condition: "",
    precipitation: 0,
  });

  const [weatherLayers, setWeatherLayers] = useState<WeatherLayer[]>([
    { id: "temperature", name: "Temperature", icon: Thermometer, color: "#ff6b6b", opacity: 0.6, enabled: false },
    { id: "precipitation", name: "Precipitation", icon: CloudRain, color: "#4ecdc4", opacity: 0.7, enabled: true },
    { id: "wind", name: "Wind Speed", icon: Wind, color: "#45b7d1", opacity: 0.5, enabled: false },
    { id: "pressure", name: "Pressure", icon: Gauge, color: "#f9ca24", opacity: 0.6, enabled: false },
    { id: "clouds", name: "Cloud Cover", icon: Cloud, color: "#ddd", opacity: 0.4, enabled: false },
    { id: "lightning", name: "Lightning", icon: Zap, color: "#feca57", opacity: 0.8, enabled: false },
    { id: "snow", name: "Snow Cover", icon: Snowflake, color: "#ffffff", opacity: 0.7, enabled: false },
  ]);

  const mapTypes = [
    { value: "roadmap", label: "Roadmap" },
    { value: "satellite", label: "Satellite" },
    { value: "hybrid", label: "Hybrid" },
    { value: "terrain", label: "Terrain" },
  ];

  // 1. Load Google Maps script ONCE
  useEffect(() => {
    if (!apiKey) return;
    let mounted = true;
    const loader = new Loader({
      apiKey,
      version: "weekly",
      libraries: ["places", "geometry"],
    });
    loader.load().then(() => { if (mounted) setIsMapLoaded(true); });
    return () => { mounted = false; };
  }, [apiKey]);

  // 2. Create map instance ONCE after loaded
  useEffect(() => {
    if (!isMapLoaded || !mapContainer.current || !window.google || map.current) return;
    map.current = new google.maps.Map(mapContainer.current, {
      center: { lat: 20, lng: 0 },
      zoom: 3,
      mapTypeId: mapType as google.maps.MapTypeId,
      styles: [{ featureType: "all", elementType: "labels", stylers: [{ visibility: "on" }] }],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
    // Clean overlays on destroy
    return () => {
      if (map.current && window.google) {
        Object.keys(overlayRefs.current).forEach((id) => removeOverlay(id));
      }
    };
  }, [isMapLoaded]);

  // 3. Handle map type change (NO side effect)
  useEffect(() => {
    if (map.current && window.google) {
      map.current.setMapTypeId(mapType as google.maps.MapTypeId);
    }
  }, [mapType]);

  // 4. Handle FIRST LOAD logic (geolocation OR city from localStorage)
  useEffect(() => {
    if (!map.current || !window.google) return;
    let hasSet = false;
    const city = localStorage.getItem("city");

    // Try geo
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (hasSet) return;
          hasSet = true;
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(new google.maps.LatLng(pos.lat, pos.lng));
          map.current?.setCenter(pos);
          map.current?.setZoom(10);
          const data = await fetchWeatherData(pos.lat, pos.lng, weatherApiKey);
          if (data) setWeatherData(data);

          // Reverse geocode for city name
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results && results.length) {
              const cityResult = results.find((r) => r.types.includes("locality"));
              const name = cityResult
                ? cityResult.formatted_address
                : results[0].formatted_address;
              setSearchText(name);
              localStorage.setItem("city", name);
            }
          });

          new google.maps.Marker({
            position: pos,
            map: map.current,
            title: "Current Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          });
        },
        async () => {
          // On geolocation denied
          if (hasSet) return;
          hasSet = true;
          if (city) {
            setSearchText(city);
            await handleLocationSearch(city, false);
          }
        }
      );
    } else if (city) {
      // If no geo, try city from localStorage
      setSearchText(city);
      handleLocationSearch(city, false);
    }
    // eslint-disable-next-line
  }, [isMapLoaded]);

  // 5. Manage overlays on weatherLayers change
  useEffect(() => {
    if (!map.current || !window.google) return;
    weatherLayers.forEach((layer) => {
      if (layer.enabled) {
        addOverlay(layer);
      } else {
        removeOverlay(layer.id);
      }
    });
    // Clean up overlays not in the state
    Object.keys(overlayRefs.current).forEach((id) => {
      if (!weatherLayers.find((l) => l.id === id && l.enabled)) {
        removeOverlay(id);
      }
    });
  }, [weatherLayers, isMapLoaded, mapType]);

  // --- Handlers and utility functions ---

  // Add overlay for one layer
  function addOverlay(layer: WeatherLayer) {
    if (!map.current || !window.google || !WEATHER_TILE_MAPS[layer.id]) return;
    removeOverlay(layer.id); // Avoid duplicates!
    const overlay = new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) =>
        `https://tile.openweathermap.org/map/${WEATHER_TILE_MAPS[layer.id]}/${zoom}/${coord.x}/${coord.y}.png?appid=${weatherApiKey}`,
      tileSize: new google.maps.Size(256, 256),
      maxZoom: 18,
      minZoom: 0,
      opacity: layer.opacity,
      name: layer.name,
    });
    map.current.overlayMapTypes.push(overlay);
    overlayRefs.current[layer.id] = overlay;
  }

  // Remove overlay for one layer
  function removeOverlay(layerId: string) {
    if (!map.current || !window.google) return;
    const overlays = map.current.overlayMapTypes;
    const overlay = overlayRefs.current[layerId];
    if (!overlay) return;
    for (let i = overlays.getLength() - 1; i >= 0; i--) {
      if (overlays.getAt(i) === overlay) overlays.removeAt(i);
    }
    overlayRefs.current[layerId] = null;
  }

  // Update overlay opacity immediately
  function updateLayerOpacity(layerId: string, opacity: number) {
    setWeatherLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, opacity: opacity / 100 } : layer
      )
    );
    const overlay = overlayRefs.current[layerId];
    if (overlay && typeof overlay.setOpacity === "function")
      overlay.setOpacity(opacity / 100);
  }

  // Toggle overlay (handled by effect)
  function toggleWeatherLayer(layerId: string) {
    setWeatherLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
  }

  // --- Fuzzy/Forgiving Search Handler ---
  const handleLocationSearch = async (input?: string, updateSearchText = true) => {
    setSearchError(null);
    const query = input?.trim() || searchText.trim() || localStorage.getItem("city")?.trim();
    if (!query || !window.google || !map.current) {
      setSearchError("Please enter a city or address.");
      return;
    }
    const geocoder = new window.google.maps.Geocoder();

    // Try user query first
    geocoder.geocode({ address: query }, async (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { location } = results[0].geometry;
        map.current?.panTo(location);
        map.current?.setZoom(12);
        const data = await fetchWeatherData(location.lat(), location.lng(), weatherApiKey);
        if (data) setWeatherData(data);
        new window.google.maps.Marker({
          map: map.current,
          position: location,
          title: results[0].formatted_address,
        });
        if (updateSearchText) {
          setSearchText(results[0].formatted_address);
          localStorage.setItem("city", results[0].formatted_address);
        }
        setSearchError(null);
      } else {
        // Fallback: try basic normalization (lowercase, single spaces)
        let fallback = query.replace(/\s+/g, " ").toLowerCase();
        if (fallback !== query.toLowerCase()) {
          geocoder.geocode({ address: fallback }, async (res2, stat2) => {
            if (stat2 === "OK" && res2 && res2[0]) {
              const { location } = res2[0].geometry;
              map.current?.panTo(location);
              map.current?.setZoom(12);
              const data = await fetchWeatherData(location.lat(), location.lng(), weatherApiKey);
              if (data) setWeatherData(data);
              new window.google.maps.Marker({
                map: map.current,
                position: location,
                title: res2[0].formatted_address,
              });
              if (updateSearchText) {
                setSearchText(res2[0].formatted_address);
                localStorage.setItem("city", res2[0].formatted_address);
              }
              setSearchError(null);
            } else {
              setSearchError(
                "Sorry, we couldn’t find that location. Please check your spelling or try a nearby city."
              );
            }
          });
        } else {
          setSearchError(
            "Sorry, we couldn’t find that location. Please check your spelling or try a nearby city."
          );
        }
      }
    });
  };

  // --- UI helpers ---

  // Weather icon selector
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "Sunny": return Sun;
      case "Cloudy": return Cloud;
      case "Rainy": return CloudRain;
      case "Snowy": return Snowflake;
      default: return Sun;
    }
  };
  const WeatherIcon = getWeatherIcon(weatherData.condition);

  if (!apiKey || !weatherApiKey) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-red-50">
        <div className="bg-white rounded-xl p-6 border shadow text-red-700 text-center">
          <b>Missing Google Maps or OpenWeather API Key.</b>
          <br />
          <span>
            Please set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> and{" "}
            <code>NEXT_PUBLIC_OPENWEATHER_API_KEY</code> in your{" "}
            <code>.env.local</code> file.
          </span>
        </div>
      </div>
    );
  }

  // --- UI Render ---
  return (
    <AppLayout
      header={
        <div className="flex flex-col items-stretch gap-1">
          <div className="flex items-center">
            <Input
              ref={searchInputRef as React.Ref<InputRef>}
              type="text"
              value={searchText}
              placeholder="Enter city or address"
              onChange={(e) => {
                setSearchText(e.target.value);
                setSearchError(null);
              }}
              onPressEnter={async () => {
                localStorage.setItem("city", searchText);
                await handleLocationSearch(searchText);
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
            />
            <Button
              shape="round"
              type="text"
              onClick={async () => {
                localStorage.setItem("city", searchText);
                await handleLocationSearch(searchText);
              }}
            >
              {<Search color="#fff" />}
            </Button>
          </div>
          {searchError && (
            <div
              style={{
                marginTop: 2,
                color: "#f87171",
                background: "#fff8f7",
                padding: "7px 12px",
                borderRadius: 7,
                fontWeight: 500,
                zIndex: 3001,
                fontSize: 13,
                minHeight: 30,
              }}
            >
              {searchError}
            </div>
          )}
        </div>
      }
      sider={
        <Card
          style={{
            width: 300,
            margin: "16px auto",
            backdropFilter: "blur(3px)",
            background: "#1C2951", // Darker background
            border: "1px solid rgba(255,255,255,0.1)", // Slightly visible border
            boxShadow: "0 0 32px 0 #0009", // Darker, more pronounced shadow
          }}
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
        >
          {/* Location Search */}
          <div className="mb-4">
            <label className="text-sm font-medium" style={{ color: "#EFF5FF" }}>
              Search Location
            </label>
            <div style={{ marginTop: 8 }}>
              <Input
                ref={searchInputRef as React.Ref<InputRef>}
                type="text"
                value={searchText}
                placeholder="Enter city or address"
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setSearchError(null);
                }}
                onPressEnter={async () => {
                  localStorage.setItem("city", searchText);
                  await handleLocationSearch(searchText);
                }}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1px solid #666",
                  color: "#1C2951",
                  marginBottom: 8,
                  fontWeight: 700,
                }}
              />
              <Button
                shape="default"
                type="primary"
                className="w-full"
                onClick={async () => {
                  localStorage.setItem("city", searchText);
                  await handleLocationSearch(searchText);
                }}
              >
                Search
              </Button>
              
            </div>
          </div>

          <div className="w-full mb-4">
            <Link href="/forecast" className="w-full">
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
                className="w-full text-center"
              >
                View Forecast
              </Button>
            </Link>
          </div>

          {/* Map Type Selector */}
          <div className="mb-4">
            <label className="text-sm font-medium" style={{ color: "#EFF5FF" }}>
              Map Type
            </label>
            <Select
              value={mapType}
              onChange={(value) => setMapType(value)}
              style={{
                width: "100%",
                marginTop: 8,
                borderRadius: 8,
                height: 40,
              }}
              styles={{
                popup: {
                  root: {
                    background: "#fff",
                    color: "#EFF5FF",
                    border: "1px solid #555",
                    zIndex: 3400,
                    borderRadius: 8,
                  },
                },
              }}
            >
              {mapTypes.map((type) => (
                <Select.Option
                  key={type.value}
                  value={type.value}
                  style={{ color: "#1C2951", background: "#fff" }}
                >
                  {type.label}
                </Select.Option>
              ))}
            </Select>
          </div>

          {/* Weather Layers */}
          <div>
            <label
              className="text-sm font-medium mb-2 block"
              style={{ color: "#EFF5FF" }}
            >
              Weather Layers
            </label>
            {weatherLayers.map((layer) => {
              const IconComponent = layer.icon;
              const description = getLayerDescription(layer.id, layer.name);

              // Color swatch style
              const swatchStyle: React.CSSProperties = {
                background: layer.color,
                opacity: layer.opacity,
                borderRadius: "50%",
                width: 22,
                height: 22,
                border: `2.5px solid ${
                  layer.enabled ? layer.color : "#d1d5db"
                }`,
                display: "inline-block",
                marginRight: 8,
                marginLeft: 0,
                boxShadow: layer.enabled ? "0 0 6px #0002" : "none",
                outline: layer.opacity < 0.15 ? "1px dashed #aaa" : undefined,
                filter: layer.enabled ? "none" : "grayscale(0.7)",
                transition: "opacity 0.3s",
              };

              return (
                <div
                  key={layer.id}
                  style={{
                    background: "#4D5683",
                    borderRadius: 10,
                    marginBottom: 12,
                    padding: 14,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    {/* Left: Swatch + Icon + Name */}
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 9 }}
                    >
                      <span
                        style={swatchStyle}
                        aria-label={`${layer.name} color`}
                      ></span>
                      <IconComponent
                        className="h-5 w-5"
                        style={{ color: layer.color }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{ color: "#EFF5FF" }}
                      >
                        {layer.name}
                      </span>
                    </div>
                    {/* Right: Toggle */}
                    <Switch
                      checked={layer.enabled}
                      onChange={() => toggleWeatherLayer(layer.id)}
                      style={{ background: layer.enabled ? undefined : "#666" }}
                    />
                  </div>
                  {/* Description */}
                  <div
                    className="text-xs mt-2 mb-2"
                    style={{
                      color: "#b1c2fc",
                      fontWeight: 500,
                      letterSpacing: 0.1,
                    }}
                  >
                    {description}
                  </div>
                  {/* Opacity control */}
                  {layer.enabled && (
                    <div style={{ marginTop: 4 }}>
                      <div
                        className="flex justify-between text-xs mb-1"
                        style={{ color: "#EFF5ee" }}
                      >
                        <span>Opacity</span>
                        <span>{Math.round(layer.opacity * 100)}%</span>
                      </div>
                      <Slider
                        value={layer.opacity * 100}
                        onChange={(value) =>
                          updateLayerOpacity(layer.id, value as number)
                        }
                        min={0}
                        max={100}
                        step={5}
                        styles={{
                          track: { background: "#40a9ff" },
                          handle: { borderColor: "#40a9ff" },
                          rail: { background: "#666" },
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      }
    >
      <div className="h-screen w-full relative bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800">
        {/* Map Container */}
        <div ref={mapContainer} className="absolute inset-0" />
        {/* Current Weather Widget */}
        <Card
          size="small"
          style={{
            position: "absolute",
            top: 60,
            right: 16,
            width: 230,
            backdropFilter: "blur(6px)",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid rgba(255,255,255,0.2)",
            boxShadow: "0 0 32px 0 #0002",
          }}
          title={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  {searchText || "Please enter a location"}{" "}
                </span>
              </div>
              <Button
                size="small"
                type="link"
                style={{ height: 32, padding: 0 }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          }
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <WeatherIcon className="h-8 w-8" style={{ color: "#2563eb" }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {Math.round(weatherData.temperature)}°C
                </div>
                <div style={{ fontSize: 14, color: "#6b7280" }}>
                  {weatherData.condition}
                </div>
              </div>
            </div>
            <Badge status="processing" text="Live" />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
            }}
          >
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4" style={{ color: "#3b82f6" }} />
              <span>{weatherData.humidity}% Humidity</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4" style={{ color: "#22c55e" }} />
              <span>{Math.round(weatherData.windSpeed)} km/h</span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4" style={{ color: "#f59e42" }} />
              <span>{Math.round(weatherData.pressure)} hPa</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" style={{ color: "#a21caf" }} />
              <span>{Math.round(weatherData.visibility)} km</span>
            </div>
          </div>

          {weatherData.precipitation > 0 && (
            <div
              style={{
                marginTop: 10,
                padding: 10,
                background: "#eff6ff",
                borderRadius: 8,
              }}
            >
              <div className="flex items-center gap-2 text-blue-700">
                <CloudRain className="h-4 w-4" />
                <span>
                  Precipitation: {weatherData.precipitation.toFixed(1)}mm/h
                </span>
              </div>
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  );
};

export default WeatherMap;
