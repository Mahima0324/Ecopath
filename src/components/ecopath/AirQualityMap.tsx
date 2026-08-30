import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

import { aqiCategory } from "@/lib/ecopath/aqi";
import type { AirQualityReading, NamedPlace } from "@/lib/ecopath/types";

const AQI_COLORS: { max: number; color: string }[] = [
  { max: 50, color: "#3fae6b" },
  { max: 100, color: "#e6b422" },
  { max: 150, color: "#e08337" },
  { max: 200, color: "#d5453c" },
  { max: 300, color: "#8e44ad" },
  { max: Infinity, color: "#7b241c" },
];

function aqiColor(aqi: number | null | undefined) {
  if (aqi == null) return "#94a3b8";
  return (AQI_COLORS.find((c) => aqi <= c.max) ?? AQI_COLORS[AQI_COLORS.length - 1]!).color;
}

function Recenter({ readings }: { readings: AirQualityReading[] }) {
  const map = useMap();
  useEffect(() => {
    if (readings.length < 2) return;
    map.fitBounds(L.latLngBounds(readings.map((r) => [r.lat, r.lon] as [number, number])), {
      padding: [30, 30],
    });
  }, [map, readings]);
  return null;
}

/** Neighbourhood air-quality map: one coloured sample per grid point. */
export default function AirQualityMap({
  center,
  readings,
}: {
  center: NamedPlace;
  readings: AirQualityReading[];
}) {
  return (
    <MapContainer
      center={[center.lat, center.lon]}
      zoom={12}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Recenter readings={readings} />
      {readings.map((reading) => (
        <CircleMarker
          key={`${reading.lat},${reading.lon}`}
          center={[reading.lat, reading.lon]}
          radius={16}
          pathOptions={{
            color: aqiColor(reading.aqi),
            fillColor: aqiColor(reading.aqi),
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Popup>
            <strong>AQI {reading.aqi == null ? "—" : Math.round(reading.aqi)}</strong>
            <br />
            {aqiCategory(reading.aqi) ?? "No data"}
            <br />
            PM2.5 {reading.pm25 == null ? "—" : reading.pm25.toFixed(1)} µg/m³
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
