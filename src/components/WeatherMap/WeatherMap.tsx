"use client";
import React, { useEffect, useRef, useState } from "react";
import { Loader } from "@googlemaps/js-api-loader";
import { WeatherData, WeatherLayer } from "@/types/Weather";
import { fetchWeatherData } from "@/actions/weather";
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
  Settings,
  MapPin,
  RefreshCw,
} from "lucide-react";

// Environment variables (must be NEXT_PUBLIC_...)
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
const weatherApiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ?? "";

const WeatherMap = () => {
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [searchMarker, setSearchMarker] = useState<google.maps.Marker | null>(
    null
  );
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapType, setMapType] = useState<string>("roadmap");
  const [currentLocation, setCurrentLocation] =
    useState<google.maps.LatLng | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData>({
    temperature: 22,
    humidity: 65,
    windSpeed: 12,
    windDirection: 245,
    pressure: 1013,
    visibility: 10,
    condition: "Partly Cloudy",
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

  // -- Loader for Google Maps
  const loadGoogleMaps = async () => {
    if (!apiKey) return;
    try {
      const loader = new Loader({
        apiKey,
        version: "weekly",
        libraries: ["places", "geometry"],
      });

      await loader.load();
      setIsMapLoaded(true);
    } catch (error) {
      console.log("Error loading Google Maps:", error);
    }
  };

  const handleLocationSearch = async () => {
    if (!searchText || !window.google || !map.current) return;

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchText },async (results, status) => {
      if (status === "OK" && results && results[0]) {
        const { location } = results[0].geometry;
        map.current?.panTo(location);
        map.current?.setZoom(12);

         const data = await fetchWeatherData(location.lat(), location.lng(), weatherApiKey);
         if (data) setWeatherData(data);

        // Optionally, place a marker:
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

  useEffect(() => {
    if (apiKey) {
      loadGoogleMaps();
    }
  }, []);

  useEffect(() => {
    if (!isMapLoaded || !mapContainer.current || !window.google) return;

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

    addWeatherOverlays();

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async(position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(new google.maps.LatLng(pos.lat, pos.lng));
          map.current?.setCenter(pos);
          map.current?.setZoom(10);

          // Fetch real weather data here!
        const data =await fetchWeatherData(pos.lat, pos.lng, weatherApiKey);
        if (data){
          setWeatherData(data);
        } 

          // Add marker for current location
          new google.maps.Marker({
            position: pos,
            map: map.current,
            title: "Current Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        },
        () => {
          console.log("Error: The Geolocation service failed.");
        }
      );
    }

    // eslint-disable-next-line
  }, [isMapLoaded, mapType]);

  // --- Weather Overlays
  const addWeatherOverlays = () => {
    if (!map.current || !window.google) return;

    // Precipitation
    map.current.overlayMapTypes.insertAt(
      0,
      new google.maps.ImageMapType({
        getTileUrl: (coord, zoom) =>
          `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${coord.x}/${coord.y}.png?appid=${weatherApiKey}`,
        tileSize: new google.maps.Size(256, 256),
        maxZoom: 18,
        minZoom: 0,
        name: "Precipitation",
      })
    );
    // (You can add more overlays conditionally by weatherLayers here)
  };

  const toggleWeatherLayer = (layerId: string) => {
    setWeatherLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
      )
    );
    // TODO: Add/remove overlays from map based on layer.enabled
  };

  const updateLayerOpacity = (layerId: string, opacity: number) => {
    setWeatherLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId ? { ...layer, opacity: opacity / 100 } : layer
      )
    );
    // TODO: Update overlay opacity on map
  };

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

  // === Show error if keys are missing
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

  // === Main app UI ===
  return (
    <div className="h-screen w-full relative bg-gradient-to-br from-blue-900 via-blue-700 to-purple-800">
      {/* Map Container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Control Panel */}
      <Card
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          width: 340,
          backdropFilter: "blur(6px)",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 0 32px 0 #0002",
        }}
        title={
          <span className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            Weather Control Center
          </span>
        }
      >
        {/* Map Type Selector */}
        <div className="mb-4">
          <label className="text-sm font-medium">Map Type</label>
          <Select
            value={mapType}
            onChange={(value) => {
              setMapType(value);
              if (map.current && window.google) {
                map.current.setMapTypeId(value as google.maps.MapTypeId);
              }
            }}
            style={{ width: "100%", marginTop: 8 }}
          >
            {mapTypes.map((type) => (
              <Select.Option key={type.value} value={type.value}>
                {type.label}
              </Select.Option>
            ))}
          </Select>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium">Search Location</label>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Input
              ref={searchInputRef as React.Ref<InputRef>}
              type="text"
              value={searchText}
              placeholder="Enter city or address"
              onChange={(e) => setSearchText(e.target.value)}
              onPressEnter={handleLocationSearch}
              style={{ flex: 1 }}
            />
            <Button type="primary" onClick={handleLocationSearch}>
              Search
            </Button>
          </div>
        </div>

        {/* Weather Layers */}
        <div>
          <label className="text-sm font-medium mb-2 block">
            Weather Layers
          </label>
          {weatherLayers.map((layer) => {
            const IconComponent = layer.icon;
            return (
              <div
                key={layer.id}
                style={{
                  background: "#f6f9fc",
                  borderRadius: 8,
                  marginBottom: 10,
                  padding: 12,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <IconComponent
                      className="h-4 w-4"
                      style={{ color: layer.color }}
                    />
                    <span className="text-sm font-medium">{layer.name}</span>
                  </div>
                  <Switch
                    checked={layer.enabled}
                    onChange={() => toggleWeatherLayer(layer.id)}
                  />
                </div>
                {layer.enabled && (
                  <div style={{ marginTop: 6 }}>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
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
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Current Weather Widget */}
      <Card
        style={{
          position: "absolute",
          top: 16,
          right: 16,
          width: 300,
          backdropFilter: "blur(6px)",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 0 32px 0 #0002",
        }}
        title={
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">Current Location</span>
            </div>
            <Button size="small" type="link" style={{ height: 32, padding: 0 }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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

      {/* Legend */}
      <Card
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          width: 270,
          backdropFilter: "blur(6px)",
          background: "rgba(255,255,255,0.9)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 0 32px 0 #0002",
        }}
      >
        <div style={{ fontWeight: 500, marginBottom: 8 }}>Legend</div>
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#3b82f6" }}
            ></div>
            <span>Light Precipitation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#2563eb" }}
            ></div>
            <span>Heavy Precipitation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#ef4444" }}
            ></div>
            <span>High Temperature</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ background: "#bae6fd" }}
            ></div>
            <span>Low Temperature</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WeatherMap;
