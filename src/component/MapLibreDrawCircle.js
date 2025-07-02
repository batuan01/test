import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { saveAs } from "file-saver";

export default function MapLibreDrawCircle() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const isDrawingCircleRef = useRef(false);
  const [area, setArea] = useState(null);

  useEffect(() => {
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style:
        "https://api.maptiler.com/maps/fefc1891-4e0d-4102-a51f-09768f839b85/style.json?key=S1qTEATai9KydkenOF6W",
      center: [105.843272, 21.005671],
      zoom: 16,
      pitchWithRotate: false, // Không cho xoay bằng chuột phải + kéo
      dragRotate: false, // Không cho xoay bằng chuột
      touchPitch: false, // Không cho xoay bằng 2 ngón tay
      pitch: 0, // Góc nghiêng = 0 (2D)
      bearing: 0, // Không xoay hướng bản đồ
    });

    // Fix className conflict between mapbox-draw & maplibre
    MapboxDraw.constants.classes.CANVAS = "maplibregl-canvas";
    MapboxDraw.constants.classes.CONTROL_BASE = "maplibregl-ctrl";
    MapboxDraw.constants.classes.CONTROL_PREFIX = "maplibregl-ctrl-";
    MapboxDraw.constants.classes.CONTROL_GROUP = "maplibregl-ctrl-group";
    MapboxDraw.constants.classes.ATTRIBUTION = "maplibregl-ctrl-attrib";

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
      },
      styles: [
        {
          id: "gl-draw-line", // <--- thêm dòng này để hiển thị khi đang vẽ
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "line-color": "#ff0000",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#ff0000",
            "fill-opacity": 0.4,
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "line-color": "#ff0000",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-polygon-midpoint",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#fbb03b",
          },
        },
        {
          id: "gl-draw-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
          paint: {
            "circle-radius": 6,
            "circle-color": "#00bcd4",
          },
        },
        {
          id: "gl-draw-line",
          type: "line",
          filter: [
            "all",
            ["==", "$type", "LineString"],
            ["!=", "mode", "static"],
          ],
          paint: {
            "line-color": "#4caf50",
            "line-width": 3,
          },
        },
      ],
    });

    map.addControl(draw);

    map.on("draw.create", updateArea);
    map.on("draw.update", updateArea);
    map.on("draw.delete", updateArea);

    map.on("click", (e) => {
      if (!isDrawingCircleRef.current) return;

      const center = [e.lngLat.lng, e.lngLat.lat];
      const circle = turf.circle(center, 10, { steps: 64, units: "meters" });
      draw.add(circle);

      isDrawingCircleRef.current = false;
    });

    mapRef.current = map;
    drawRef.current = draw;

    return () => map.remove();
  }, []);

  const updateArea = () => {
    const data = drawRef.current.getAll();
    if (data.features.length > 0) {
      const areaValue = turf.area(data);
      setArea(Math.round(areaValue * 100) / 100);
    } else {
      setArea(null);
    }
  };

  const handleSave = () => {
    const data = drawRef.current.getAll();
    if (data.features.length === 0) {
      alert("❌ Không có polygon nào để lưu.");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    saveAs(blob, "polygon_data.geojson");
  };

  const handleStartDrawCircle = () => {
    isDrawingCircleRef.current = true;
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapContainer} style={{ height: "100%" }} />
      <button className="draw-circle-button" onClick={handleStartDrawCircle}>
        ⚪
      </button>
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 10,
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          padding: "15px",
          width: "180px",
          textAlign: "center",
        }}
      >
        <p>Draw a polygon using the draw tools.</p>
        {area !== null && (
          <p>
            <strong>{area}</strong>
            <br /> square meters
          </p>
        )}
        <button onClick={handleSave}>💾 Save GeoJSON</button>
      </div>
    </div>
  );
}
