import { loadFromLocalStorage } from "../utils";

export class LoadData {
  static loadDefaultData = (map) => {
    const geojson = loadFromLocalStorage();
    if (!geojson) return;

    geojson.features.forEach((f) => {
      this.AddFeature(f, map);
    });
  };

  static LoadColor = (map) => {
    const applyColorToDrawLayers = () => {
      const layers = map.getStyle().layers;
      layers
        .filter((l) => l.id.startsWith("td")) // hoặc "terra-draw"
        .forEach(({ id, type }) => {
          try {
            const colorExpr = [
              "case",
              ["==", ["get", "color"], ""],
              "#787878", // nếu color là chuỗi rỗng
              ["!", ["has", "color"]],
              "#787878", // nếu không có color
              ["get", "color"], // ngược lại dùng color trong feature
            ];

            if (type === "fill") {
              map.setPaintProperty(id, "fill-color", colorExpr);
            } else if (type === "line") {
              map.setPaintProperty(id, "line-color", colorExpr);
            } else if (type === "circle") {
              map.setPaintProperty(id, "circle-color", colorExpr);
            }
          } catch (err) {
            console.warn(`⚠️ Không đổi được màu layer ${id}:`, err);
          }
        });
    };

    requestAnimationFrame(() => {
      applyColorToDrawLayers();
    });
  };

  static AddFeature = (feature, map) => {
    const id = feature.id;
    if (!id || !feature.geometry) return;

    const sourceId = `source-${id}`;
    const layerId = `layer-${id}`;

    // Nếu đã có thì bỏ qua
    if (map.getLayer(layerId) || map.getSource(sourceId)) return;

    const geometryType = feature.geometry.type;

    // 👇 TH1: Polygon
    if (geometryType === "Polygon") {
      map.addSource(sourceId, {
        type: "geojson",
        data: feature,
      });

      //   map.addLayer({
      //     id: layerId,
      //     type: "fill-extrusion",
      //     source: sourceId,
      //     paint: {
      //       "fill-extrusion-color": feature.properties?.color || "#787878",
      //       "fill-extrusion-height": feature.properties?.height || 0,
      //       "fill-extrusion-base": 0,
      //       "fill-extrusion-opacity": 1,
      //     },
      //   });

      map.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: {
          "fill-color": feature.properties?.color || "#787878",
          "fill-opacity": 0.3, // màu nền trong suốt
        },
      });

      // Layer line (viền đen đậm)
      map.addLayer({
        id: `${layerId}-outline`,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": "#787878", // viền đen
          "line-width": 4,
          "line-opacity": 1,
        },
      });

      return;
    }

    // 👇 TH2: Image (custom)
    if (geometryType === "Image") {
      const bounds = feature.geometry.coordinates;
      const imageUrl = feature.properties?.imageUrl;

      map.addSource(sourceId, {
        type: "image",
        url: imageUrl,
        coordinates: bounds,
      });

      map.addLayer({
        id: layerId,
        type: "raster",
        source: sourceId,
        paint: {
          "raster-fade-duration": 0,
          "raster-opacity": 1,
        },
      });

      return;
    }

    // 👇 TH3: LineString
    if (geometryType === "LineString") {
      map.addSource(sourceId, {
        type: "geojson",
        data: feature,
      });

      map.addLayer({
        id: layerId,
        type: "line",
        source: sourceId,
        paint: {
          "line-color": feature.properties?.color || "#0066CC",
          "line-width": feature.properties?.width || 2,
        },
      });

      return;
    }

    // 👇 TH4: Point (nếu muốn hỗ trợ)
    if (geometryType === "Point") {
      map.addSource(sourceId, {
        type: "geojson",
        data: feature,
      });

      map.addLayer({
        id: layerId,
        type: "circle",
        source: sourceId,
        paint: {
          "circle-color": feature.properties?.color || "#FF0000",
          "circle-radius": feature.properties?.radius || 6,
        },
      });

      return;
    }
  };
}
