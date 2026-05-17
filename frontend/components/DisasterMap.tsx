"use client";
import { MapContainer, TileLayer, Circle, Popup, useMap } from "react-leaflet";
import { type Disaster } from "@/lib/api";
import { DISASTER_TYPE_LABELS } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  deprem:  "#f59e0b",
  sel:     "#3b82f6",
  yangin:  "#ef4444",
  dolu:    "#06b6d4",
  heyelan: "#d97706",
};

function FlyTo({ disaster }: { disaster: Disaster | null }) {
  const map = useMap();
  if (disaster) map.flyTo([disaster.center_lat, disaster.center_lon], 9, { duration: 1 });
  return null;
}

interface Props {
  disasters: Disaster[];
  selected: Disaster | null;
  onSelect: (d: Disaster) => void;
  heatMode?: boolean;
}

const GEO_TILE  = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const HEAT_TILE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

export default function DisasterMap({ disasters, selected, onSelect, heatMode = false }: Props) {
  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <MapContainer center={[39.0, 35.0]} zoom={6} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          key={heatMode ? "heat" : "geo"}
          url={heatMode ? HEAT_TILE : GEO_TILE}
        />
        <FlyTo disaster={selected} />
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
      </MapContainer>
    </>
  );
}
