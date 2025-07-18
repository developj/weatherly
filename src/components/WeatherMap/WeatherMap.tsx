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

// Environment variables (must be NEXT_PUBLIC_...)
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const weatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "";

const WEATHER_TILE_MAPS: Record<string, string> = {
  temperature: "temp_new",
  precipitation: "precipitation_new",
  wind: "wind_new",
  pressure: "pressure_new",
  clouds: "clouds_new",
  lightning: "lightning_new",
  snow: "snow_new",
};

const getLayerDescription = (id: string, name: string) => {
  switch (id) {
    case "precipitation":
      return "Rain/Snow Intensity";
    case "temperature":
      return "Temperature (blue=cold, red=hot)";
    case "wind":
      return "Wind Speed";
    case "pressure":
      return "Atmospheric Pressure";
    case "clouds":
      return "Cloud Coverage";
    case "lightning":
      return "Lightning Strikes";
    case "snow":
      return "Snow Cover";
    default:
      return name;
  }
};

const WeatherMap = () => {
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const overlayRefs = useRef<Record<string, google.maps.ImageMapType | null>>(
    {}
  );
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<string>("roadmap");
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLng | null>(null);
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
    {
      id: "temperature",
      name: "Temperature",
      icon: Thermometer,
      color: "#ff6b6b",
      opacity: 0.6,
      enabled: false,
    },
    {
      id: "precipitation",
      name: "Precipitation",
      icon: CloudRain,
      color: "#4ecdc4",
      opacity: 0.7,
      enabled: true,
    },
    {
      id: "wind",
      name: "Wind Speed",
      icon: Wind,
      color: "#45b7d1",
      opacity: 0.5,
      enabled: false,
    },
    {
      id: "pressure",
      name: "Pressure",
      icon: Gauge,
      color: "#f9ca24",
      opacity: 0.6,
      enabled: false,
    },
    {
      id: "clouds",
      name: "Cloud Cover",
      icon: Cloud,
      color: "#ddd",
      opacity: 0.4,
      enabled: false,
    },
    {
      id: "lightning",
      name: "Lightning",
      icon: Zap,
      color: "#feca57",
      opacity: 0.8,
      enabled: false,
    },
    {
      id: "snow",
      name: "Snow Cover",
      icon: Snowflake,
      color: "#ffffff",
      opacity: 0.7,
      enabled: false,
    },
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
    loader
      .load()
      .then(() => {
        if (mounted) setIsMapLoaded(true);
      })
      .catch((error) => {
        console.log("Error loading Google Maps:", error);
      });
    return () => {
      mounted = false;
    };
  }, [apiKey]);

  // 2. Create map instance ONCE after loaded
  useEffect(() => {
    if (!isMapLoaded || !mapContainer.current || !window.google || map.current)
      return;
    map.current = new google.maps.Map(mapContainer.current, {
      center: { lat: 20, lng: 0 },
      zoom: 3,
      mapTypeId: mapType as google.maps.MapTypeId,
      styles: [
        {
          featureType: "all",
          elementType: "labels",
          stylers: [{ visibility: "on" }],
        },
      ],
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
    // eslint-disable-next-line
  }, [isMapLoaded]);

  // 3. Handle map type change (NO side effect)
  useEffect(() => {
    if (map.current && window.google) {
      map.current.setMapTypeId(mapType as google.maps.MapTypeId);
    }
  }, [mapType]);

  // 4. Initial geolocation + weather fetch ONCE after map created
  useEffect(() => {
    if (!map.current || !window.google) return;
    let called = false;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (called) return;
          called = true;
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(new google.maps.LatLng(pos.lat, pos.lng));
          map.current?.setCenter(pos);
          map.current?.setZoom(10);
          const data = await fetchWeatherData(pos.lat, pos.lng, weatherApiKey);
          if (data) setWeatherData(data);
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
          // Reverse geocode here
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: pos }, (results, status) => {
            if (status === "OK" && results && results.length) {
              // Use the formatted address or just the locality
              // For just city name:
              const cityResult = results.find((r) =>
                r.types.includes("locality")
              );
              const name = cityResult
                ? cityResult.formatted_address
                : results[0].formatted_address;

              setSearchText(name);
            }
          });
        },
        () => {
          // Fallback if denied
        }
      );
    }
  }, [isMapLoaded]);

  // 5. Manage overlays on weatherLayers change (no API call)
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
    // eslint-disable-next-line
  }, [weatherLayers, isMapLoaded, mapType]);

  // --- Handlers and utility functions ---

  // Add overlay for one layer
  function addOverlay(layer: WeatherLayer) {
    if (!map.current || !window.google || !WEATHER_TILE_MAPS[layer.id]) return;
    removeOverlay(layer.id); // Avoid duplicates!
    const overlay = new google.maps.ImageMapType({
      getTileUrl: (coord, zoom) =>
        `https://tile.openweathermap.org/map/${
          WEATHER_TILE_MAPS[layer.id]
        }/${zoom}/${coord.x}/${coord.y}.png?appid=${weatherApiKey}`,
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

  // Handle location search
  const handleLocationSearch = async () => {
    if (!searchText || !window.google || !map.current) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchText }, async (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { location } = results[0].geometry;
        map.current?.panTo(location);
        map.current?.setZoom(12);
        const data = await fetchWeatherData(
          location.lat(),
          location.lng(),
          weatherApiKey
        );
        if (data) setWeatherData(data);
        new window.google.maps.Marker({
          map: map.current,
          position: location,
          title: results[0].formatted_address,
        });
      } else {
        alert("Location not found. Try something else!");
      }
    });
  };

  // --- UI helpers ---

  // Weather icon selector
  const getWeatherIcon = (condition: string) => {
    switch (condition) {
      case "Sunny":
        return Sun;
      case "Cloudy":
        return Cloud;
      case "Rainy":
        return CloudRain;
      case "Snowy":
        return Snowflake;
      default:
        return Sun;
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
        <div className="flex items-center">
          <Input
            ref={searchInputRef as React.Ref<InputRef>}
            type="text"
            value={searchText}
            placeholder="Enter city or address"
            onChange={(e) => setSearchText(e.target.value)}
            onPressEnter={handleLocationSearch}
            style={{
              flex: 1,
              margin: "8px 12px",
              marginRight: 0,
              background: "#fff",
              border: "1px solid #666",
              color: "#1C2951",
              marginBottom: 8,
            }}
          />{" "}
          <Button shape="round" type="text" onClick={handleLocationSearch}>
            {<Search color="#fff" />}
          </Button>
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
                onChange={(e) => setSearchText(e.target.value)}
                onPressEnter={handleLocationSearch}
                style={{
                  flex: 1,
                  background: "#fff",
                  border: "1px solid #666",
                  color: "#1C2951",
                  marginBottom: 8,
                }}
              />
              <Button
                shape="default"
                type="primary"
                className="w-full"
                onClick={handleLocationSearch}
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
                className="w-full text-center py-2"
              >
                Forecast
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
                // onClick={/* Optionally add refresh logic */}
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
