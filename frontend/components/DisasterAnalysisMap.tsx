"use client";
import { useEffect, useRef } from "react";
import type { Disaster, DisasterPolicyResult } from "@/lib/api";
import "leaflet/dist/leaflet.css";

const SCORE_COLOR = (score: number) =>
  score >= 75 ? "#ef4444" : score >= 50 ? "#f97316" : score >= 25 ? "#eab308" : "#22c55e";

interface Props {
  disaster: Disaster;
  results: DisasterPolicyResult[];
  selected: DisasterPolicyResult | null;
  onSelect: (r: DisasterPolicyResult | null) => void;
}

export default function DisasterAnalysisMap({ disaster, results, selected, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);
  const circleRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");

    const map = L.map(containerRef.current, {
      center: [disaster.center_lat, disaster.center_lon],
      zoom: 10,
      zoomControl: true,
    });

    // Esri World Imagery — gerçek Maxar uydu görüntüsü (API key gerekmez)
    const esriSatellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Esri, Maxar, Earthstar Geographics", maxZoom: 19 }
    );

    // OpenStreetMap — "Öncesi" referans katmanı
    const osmLayer = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "© OpenStreetMap", maxZoom: 19 }
    );

    esriSatellite.addTo(map);
    L.control.layers({ "🛰️ Uydu (Sonrası)": esriSatellite, "🗺️ Harita (Öncesi)": osmLayer }, {}).addTo(map);

    // Etki alanı dairesi
    circleRef.current = L.circle([disaster.center_lat, disaster.center_lon], {
      radius: disaster.radius_km * 1000,
      color: "#ef4444",
      fillColor: "#ef4444",
      fillOpacity: 0.08,
      weight: 2,
      dashArray: "6 4",
    }).addTo(map);

    // Merkez marker
    L.circleMarker([disaster.center_lat, disaster.center_lon], {
      radius: 10, color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.9, weight: 2,
    }).bindTooltip(`<b>Merkez</b><br/>${disaster.name}`, { permanent: false }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analiz sonuçları gelince marker ekle
  useEffect(() => {
    if (!mapRef.current || results.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const map = mapRef.current as ReturnType<typeof L.map>;

    // Önceki marker'ları temizle
    markersRef.current.forEach((m: unknown) => (m as ReturnType<typeof L.circleMarker>).remove());
    markersRef.current = [];

    results.forEach((r) => {
      const color = SCORE_COLOR(r.satellite_score);
      const marker = L.circleMarker([r.lat, r.lon], {
        radius: 9,
        color: "#fff",
        fillColor: color,
        fillOpacity: 0.9,
        weight: 2,
      });

      marker.bindTooltip(
        `<div style="font-size:12px;min-width:160px">
          <b>${r.policy_number}</b><br/>
          ${r.property_address}<br/>
          <span style="color:${color};font-weight:600">Hasar: ${r.satellite_score}/100</span><br/>
          Risk: ${r.estimated_loss.toLocaleString("tr-TR")} TL
        </div>`,
        { direction: "top" }
      );

      marker.on("click", () => {
        // Handled by parent via onSelect
      });

      marker.addTo(map);
      markersRef.current.push(marker);
    });

    // Tüm marker'ları kapsayacak şekilde zoom
    const bounds = L.latLngBounds(results.map((r) => [r.lat, r.lon]));
    map.fitBounds(bounds.pad(0.2));
  }, [results]);

  // Seçili poliçeye zoom
  useEffect(() => {
    if (!mapRef.current || !selected) return;
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require("leaflet");
    const map = mapRef.current as ReturnType<typeof L.map>;
    map.setView([selected.lat, selected.lon], 16, { animate: true });
  }, [selected]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%" }} />;
}
