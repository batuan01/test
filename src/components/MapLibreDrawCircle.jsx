import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { saveAs } from "file-saver";
import { createMap } from "../core/actions/map";

export default function MapLibreDrawCircle() {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const isDrawingCircleRef = useRef(false);
  const [area, setArea] = useState(null);

  useEffect(() => {
    const map = createMap({
      mapContainer: mapContainer.current,
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
            "line-color": "#0099FF",
            "line-width": 2,
          },
        },
        {
          id: "gl-draw-polygon-fill",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "fill-color": "#0099FF",
            "fill-opacity": 0.4,
          },
        },
        {
          id: "gl-draw-polygon-stroke",
          type: "line",
          filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
          paint: {
            "line-color": "#0099FF",
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
        {
          id: "gl-draw-polygon-vertex",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"], ["==", "meta", "vertex"]],
          paint: {
            "circle-radius": 5,
            "circle-color": "#ff5722", // màu cam nổi bật
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

    // map.on("click", (e) => {
    //   const allFeatures = draw.getAll();
    //   const clickPoint = turf.point([e.lngLat.lng, e.lngLat.lat]);

    //   const clickedPolygon = allFeatures.features.find(
    //     (feature) =>
    //       feature.geometry.type === "Polygon" &&
    //       turf.booleanPointInPolygon(clickPoint, feature)
    //   );

    //   if (!clickedPolygon) {
    //     console.log("❌ Không click vào polygon nào");
    //     return;
    //   }

    //   console.log("✅ Click vào polygon", clickedPolygon);

    //   // Tạo bounding box quanh polygon
    //   const bbox = turf.bbox(clickedPolygon);
    //   const bboxPolygon = turf.bboxPolygon(bbox);
    //   bboxPolygon.properties = { type: "bbox" };

    //   // Xoá bbox cũ nếu có
    //   const currentFeatures = draw.getAll().features;
    //   const oldBox = currentFeatures.find((f) => f.properties?.type === "bbox");
    //   if (oldBox) draw.delete(oldBox.id);

    //   // Thêm bbox mới
    //   draw.add(bboxPolygon);
    // });

    // Tạo source và layer để hiển thị bbox khi hover (chỉ cần chạy một lần sau khi map load)
    map.on("load", () => {
      if (!map.getSource("bbox-hover")) {
        map.addSource("bbox-hover", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      if (!map.getLayer("bbox-hover-line")) {
        map.addLayer({
          id: "bbox-hover-line",
          type: "line",
          source: "bbox-hover",
          layout: {},
          paint: {
            "line-color": "#0099FF",
            "line-width": 2,
          },
        });
      }
    });

    map.on("mousemove", (e) => {
      const drawMode = draw.getMode();
      if (drawMode !== "simple_select") return;

      const allFeatures = draw.getAll();
      const movePoint = turf.point([e.lngLat.lng, e.lngLat.lat]);

      const hoveredPolygon = allFeatures.features.find(
        (feature) =>
          feature.geometry.type === "Polygon" &&
          turf.booleanPointInPolygon(movePoint, feature)
      );

      if (!hoveredPolygon || hoveredPolygon.geometry.type !== "Polygon") {
        const source = map.getSource("bbox-hover");

        if (source) {
          source.setData({
            type: "FeatureCollection",
            features: [],
          });
        }
        return;
      }

      const bbox = turf.bbox(hoveredPolygon);
      const bboxPolygon = turf.bboxPolygon(bbox);
      bboxPolygon.properties = { type: "hover-bbox" };

      const source = map.getSource("bbox-hover");
      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: [bboxPolygon],
        });
      }
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

  function handlePolygonClick(e) {
    const feature = e.features?.[0];
    console.log("feature", e);
    if (!feature || feature.geometry.type !== "Polygon") return;

    const bbox = turf.bbox(feature); // [minX, minY, maxX, maxY]
    const bboxPolygon = turf.bboxPolygon(bbox);
    bboxPolygon.properties = { type: "bbox" }; // để trigger style

    const draw = drawRef.current;
    if (!draw) return;

    // Xóa bbox cũ (nếu có)
    const existing = draw
      .getAll()
      .features.find((f) => f.properties?.type === "bbox");
    if (existing) draw.delete(existing.id);

    draw.add(bboxPolygon);
  }

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
