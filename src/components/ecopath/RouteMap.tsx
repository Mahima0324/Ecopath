import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";

import { aqiCategory } from "@/lib/ecopath/aqi";
import { formatDistance, formatDuration } from "@/lib/ecopath/format";
import { ROAD_LABEL } from "@/lib/ecopath/roads";
import type { AnalyzedRoute, NamedPlace, PollutionLevel } from "@/lib/ecopath/types";

const AQI_COLORS: { max: number; color: string }[] = [
  { max: 50, color: "#3fae6b" },
  { max: 100, color: "#e6b422" },
  { max: 150, color: "#e08337" },
  { max: 200, color: "#d5453c" },
  { max: 300, color: "#8e44ad" },
  { max: Infinity, color: "#7b241c" },
];

const LEVEL_COLOR: Record<PollutionLevel, string> = {
  LOW: "#0f9d78",
  MODERATE: "#e6b422",
  HIGH: "#d5453c",
};

function aqiColor(aqi: number | null) {
  if (aqi == null) return "#94a3b8";
  return (AQI_COLORS.find((c) => aqi <= c.max) ?? AQI_COLORS[AQI_COLORS.length - 1]!).color;
}

function pinIcon(label: string, color: string) {
  return L.divIcon({
    className: "",
    html: `<div style="display:flex;align-items:center;gap:6px;transform:translate(-10px,-10px)">
      <span style="width:20px;height:20px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35)"></span>
      <span style="background:white;border-radius:6px;padding:1px 6px;font:600 11px/1.4 Manrope,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.18)">${label}</span>
    </div>`,
    iconSize: [0, 0],
  });
}

function FitBounds({ routes }: { routes: AnalyzedRoute[] }) {
  const map = useMap();
  useEffect(() => {
    const points = routes.flatMap((r) => r.geometry);
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points as [number, number][]), { padding: [40, 40] });
  }, [map, routes]);
  return null;
}

interface RouteMapProps {
  origin: NamedPlace;
  destination: NamedPlace;
  routes: AnalyzedRoute[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function RouteMap({ origin, destination, routes, selectedId, onSelect }: RouteMapProps) {
  const center: [number, number] = [
    (origin.lat + destination.lat) / 2,
    (origin.lon + destination.lon) / 2,
  ];

  const ordered = [...routes].sort((a, b) => (a.id === selectedId ? 1 : b.id === selectedId ? -1 : 0));
  const selected = routes.find((r) => r.id === selectedId);

  return (
    <MapContainer center={center} zoom={12} scrollWheelZoom className="h-full w-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      <FitBounds routes={routes} />

      {ordered.map((route) => {
        const isSelected = route.id === selectedId;
        return (
          <Polyline
            key={route.id}
            positions={route.geometry}
            pathOptions={{
              color: LEVEL_COLOR[route.pollutionLevel],
              weight: isSelected ? 7 : 4,
              opacity: isSelected ? 0.95 : 0.4,
              dashArray: isSelected ? undefined : "6 8",
            }}
            eventHandlers={{ click: () => onSelect(route.id) }}
          >
            <Popup>
              <div className="space-y-1 text-xs">
                <div className="text-sm font-semibold">{route.name}</div>
                <div>
                  {formatDuration(route.durationSeconds)} · {formatDistance(route.distanceMeters)}
                </div>
                <div>
                  Pollution exposure: <strong>{route.pollutionLevel}</strong>
                  {route.aqiExposure != null && ` (AQI ${Math.round(route.aqiExposure)})`}
                </div>
                <div>Estimated traffic: {route.trafficLevel}</div>
                {route.roadComposition.map((row) => (
                  <div key={row.roadClass}>
                    {ROAD_LABEL[row.roadClass]}: {formatDistance(row.distanceMeters)} (
                    {Math.round(row.share * 100)}%)
                  </div>
                ))}
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {selected?.samples.map((sample, i) => (
        <CircleMarker
          key={`${selectedId}-${i}`}
          center={[sample.lat, sample.lon]}
          radius={7}
          pathOptions={{
            color: "#ffffff",
            weight: 2,
            fillColor: aqiColor(sample.aqi),
            fillOpacity: 0.95,
          }}
        >
          <Popup>
            <div className="text-xs">
              <div className="font-semibold">
                AQI {sample.aqi == null ? "unavailable" : Math.round(sample.aqi)}
              </div>
              <div>{aqiCategory(sample.aqi) ?? "No reading at this point"}</div>
              {sample.pm25 != null && <div>PM2.5 {sample.pm25.toFixed(1)} µg/m³</div>}
              {sample.pm10 != null && <div>PM10 {sample.pm10.toFixed(1)} µg/m³</div>}
            </div>
          </Popup>
        </CircleMarker>
      ))}

      <Marker position={[origin.lat, origin.lon]} icon={pinIcon("Start", "#0f9d78")} />
      <Marker position={[destination.lat, destination.lon]} icon={pinIcon("End", "#d5453c")} />
    </MapContainer>
  );
}
