"use client";
import { MapContainer, TileLayer, Circle, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import { type Disaster } from "@/lib/api";
import { DISASTER_TYPE_LABELS } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  deprem:  "#f59e0b",
  sel:     "#3b82f6",
  yangin:  "#ef4444",
  dolu:    "#06b6d4",
  heyelan: "#d97706",
};

function scoreColor(score?: number): string {
  if (score === undefined) return "#0891b2";
  if (score >= 70) return "#ef4444";
  if (score >= 40) return "#f97316";
  if (score >= 15) return "#eab308";
  return "#22c55e";
}

function FlyTo({ disaster }: { disaster: Disaster | null }) {
  const map = useMap();
  if (disaster) map.flyTo([disaster.center_lat, disaster.center_lon], 9, { duration: 1 });
  return null;
}

export interface PolicyMarker {
  lat: number;
  lon: number;
  score?: number;
  policyNumber?: string;
  policyId?: number;
}

interface Props {
  disasters: Disaster[];
  selected: Disaster | null;
  onSelect: (d: Disaster) => void;
  heatMode?: boolean;
  policyMarkers?: PolicyMarker[];
}

const GEO_TILE  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const HEAT_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

export default function DisasterMap({
  disasters,
  selected,
  onSelect,
  heatMode = false,
  policyMarkers = [],
}: Props) {
  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer center={[39.0, 35.0]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          key={heatMode ? "heat" : "geo"}
          url={heatMode ? HEAT_TILE : GEO_TILE}
        />
        <FlyTo disaster={selected} />

        {/* Afet çemberleri */}
        {disasters.map((d) => (
          <Circle
            key={d.id}
            center={[d.center_lat, d.center_lon]}
            radius={d.radius_km * 1000}
            pathOptions={{
              color:       TYPE_COLORS[d.disaster_type] ?? "#6b7280",
              fillColor:   TYPE_COLORS[d.disaster_type] ?? "#6b7280",
              fillOpacity: heatMode
                ? (selected?.id === d.id ? 0.65 : 0.42)
                : (selected?.id === d.id ? 0.30 : 0.15),
              weight: selected?.id === d.id ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(d) }}
          >
            <Popup>
              <div className="text-sm">
                <strong>{d.name}</strong><br />
                {DISASTER_TYPE_LABELS[d.disaster_type]} · Şiddet: {d.severity_score}/100<br />
                {d.city} · {d.affected_policy_count ?? 0} poliçe
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Poliçe konumu işaretçileri */}
        {policyMarkers.map((m, i) => {
          const color = scoreColor(m.score);
          const radius = heatMode
            ? (m.score !== undefined ? Math.max(8, Math.round(m.score / 8)) : 8)
            : 7;
          return (
            <CircleMarker
              key={`pm-${m.policyId ?? i}`}
              center={[m.lat, m.lon]}
              radius={radius}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: heatMode ? 0.85 : 0.75,
                weight: 1.5,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                <div className="text-xs leading-tight">
                  {m.policyNumber && <div className="font-semibold">{m.policyNumber}</div>}
                  {m.score !== undefined
                    ? <div>Hasar Skoru: <strong>{m.score}/100</strong></div>
                    : <div className="text-gray-500">Analiz bekleniyor</div>
                  }
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </>
  );
}
