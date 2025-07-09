import { loadFromLocalStorage } from "../utils";
import booths from "../../data/boothsjson.json";

export class LoadData {
  // static loadDefaultData = (map) => {
  //   const geojson = loadFromLocalStorage();
  //   if (!geojson) return;

  //   geojson.features.forEach((f) => {
  //     this.AddFeature(f, map);
  //   });
  // };

  // static loadDefaultData = (map) => {
  //   if (!booths?.features || booths.features.length === 0) return;

  //   const polygons = booths.features.filter(
  //     (f) => f.geometry.type === "Polygon"
  //   );
  //   const images = booths.features.filter((f) => f.geometry.type === "Image");

  //   // === Load từng Polygon ===
  //   polygons.forEach((polygonFeature, index) => {
  //     const id = polygonFeature.id || `polygon-${index}`;
  //     const sourceId = `polygon-source-${id}`;
  //     const layerId = `polygon-layer-${id}`;

  //     const polygonGeoJSON = {
  //       type: "FeatureCollection",
  //       features: [polygonFeature],
  //     };

  //     // Nếu source đã tồn tại, thì cập nhật data nếu khác
  //     if (map.getSource(sourceId)) {
  //       const source = map.getSource(sourceId);
  //       if (source.setData) {
  //         const currentData = source._data || {};
  //         const isSame =
  //           JSON.stringify(currentData.features) ===
  //           JSON.stringify(polygonGeoJSON.features);
  //         if (!isSame) source.setData(polygonGeoJSON);
  //       }
  //     } else {
  //       // Add source mới
  //       map.addSource(sourceId, {
  //         type: "geojson",
  //         data: polygonGeoJSON,
  //       });

  //       // Add layer mới
  //       map.addLayer({
  //         id: layerId,
  //         type: "fill",
  //         source: sourceId,
  //         paint: {
  //           "fill-color": polygonFeature.properties?.color || "#ccc",
  //           "fill-opacity": 0.6,
  //         },
  //       });
  //     }
  //   });

  //   // === Load từng Image ===
  //   images.forEach((imageFeature, index) => {
  //     const id = imageFeature.id || `image-${index}`;
  //     const sourceId = `image-source-${id}`;
  //     const layerId = `image-layer-${id}`;

  //     const coordinates = imageFeature.geometry.coordinates;
  //     const imageUrl = imageFeature.properties?.imageUrl;
  //     if (!coordinates || !imageUrl) return;

  //     if (!map.getSource(sourceId)) {
  //       map.addSource(sourceId, {
  //         type: "image",
  //         url: imageUrl,
  //         coordinates,
  //       });

  //       map.addLayer({
  //         id: layerId,
  //         type: "raster",
  //         source: sourceId,
  //       });
  //     }
  //   });
  // };

  static splitFeatureGroups(features) {
    const result = [];
    let current = [];

    for (const f of features) {
      const isImage = f.geometry.type === "Image";

      if (isImage) {
        if (current.length) {
          result.push({
            type: "FeatureCollection",
            features: current,
          });
        }
        result.push({
          type: "FeatureCollection",
          features: [f],
        });
        current = [];
      } else if (
        !current.length ||
        current[0].geometry.type === f.geometry.type
      ) {
        current.push(f);
      } else {
        result.push({
          type: "FeatureCollection",
          features: current,
        });
        current = [f];
      }
    }

    if (current.length) {
      result.push({
        type: "FeatureCollection",
        features: current,
      });
    }

    return result;
  }

  static loadDefaultData = (map) => {
    const geojson = loadFromLocalStorage();
    if (!geojson) return;

    const splitGeojson = this.splitFeatureGroups(geojson.features);
    console.log(splitGeojson);

    let index = 0;
    splitGeojson.forEach((f) => {
      index += 1;
      if (f.features[0].geometry.type === "Image") return;
      map.addSource(`source-${index}`, {
        type: "geojson",
        data: f,
      });

      // 3) Tạo layer vẽ polygon, bind fill-color từ properties.color
      map.addLayer({
        id: `layer-${index}`,
        type: "fill",
        source: `source-${index}`,
        paint: {
          "fill-color": "#787878",
          "fill-opacity": 0.3, // màu nền trong suốt
        },
      });
    });
  };

  // static loadDefaultData = (map) => {
  //   const geojson = loadFromLocalStorage();
  //   if (!geojson) return;

  //   // 1) Thêm GeoJSON source chung
  //   map.addSource("booths", {
  //     type: "geojson",
  //     data: booths,
  //   });

  //   // 3) Tạo layer vẽ polygon, bind fill-color từ properties.color
  //   map.addLayer({
  //     id: "booth-polygons",
  //     type: "fill",
  //     source: "booths",
  //     paint: {
  //       "fill-color": "#787878",
  //       "fill-opacity": 0.3, // màu nền trong suốt
  //     },
  //   });
  // };

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
    const outlineId = `outline-${id}`;

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
        id: outlineId,
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
          "line-width": feature.properties?.width || 4,
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
