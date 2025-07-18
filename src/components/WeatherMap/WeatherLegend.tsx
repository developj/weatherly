import React from "react";
import type { WeatherLayer } from "@/types/Weather";

interface WeatherLegendProps {
  layers: WeatherLayer[];
  className?: string;
  style?: React.CSSProperties;
}

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

const WeatherLegend: React.FC<WeatherLegendProps> = ({
  layers,
  className = "",
  style = {},
}) => (
  <div
    className={`space-y-2 text-xs w-full max-w-xs md:max-w-full ${className}`}
    style={{
      ...style,
      maxHeight: "32vh",
      overflowY: "auto",
      paddingRight: 4,
    }}
    data-testid="weather-legend"
  >
    <div style={{ fontWeight: 500, marginBottom: 8 }}>Legend</div>
    {layers.map((layer) => {
      const description = getLayerDescription(layer.id, layer.name);
      const boxStyle: React.CSSProperties = {
        background: layer.color,
        opacity: layer.opacity,
        borderRadius: 6,
        width: 18,
        height: 18,
        border: `2px solid ${layer.enabled ? layer.color : "#d1d5db"}`,
        display: "inline-block",
        marginRight: 7,
        boxShadow: layer.enabled ? "0 0 6px #0001" : "none",
        transition: "opacity 0.3s",
        outline: layer.opacity < 0.15 ? "1px dashed #aaa" : undefined,
        filter: layer.enabled ? "none" : "grayscale(0.8)",
      };
      return (
        <div key={layer.id} className="flex items-center gap-2">
          <div style={boxStyle}></div>
          <span>
            <span style={{ fontWeight: 500 }}>{layer.name}</span>
            {layer.enabled ? (
              <span style={{ color: "#888", marginLeft: 4 }}>
                ({Math.round(layer.opacity * 100)}%)
              </span>
            ) : (
              <span style={{ color: "#bbb", marginLeft: 4 }}>(Hidden)</span>
            )}
            <br />
            <span style={{ color: "#6b7280" }}>{description}</span>
          </span>
        </div>
      );
    })}
  </div>
);

export default WeatherLegend;
