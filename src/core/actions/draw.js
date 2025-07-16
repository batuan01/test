import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { AppGlobals } from "../globals";
import {
  generateUUID,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "../utils";
import { LoadData } from "./loadData";
import { DistanceElement } from "./element/distanceElement";
import { isPathElement } from "./element/typeChecks";

export class DrawElement {
  static Terradraw = (map, drawRef, isPathRef) => {
    map.on("load", () => {
      const draw = new MaplibreTerradrawControl();

      map.addControl(draw);
      drawRef.current = draw;

      // 🔁 Lắng nghe thay đổi và tự động lưu
      this.SaveAndLoadData(draw, map, isPathRef);
      this.SaveAndLoadPath(draw, map, isPathRef);

      // 🔁 Lắng nghe thay đổi màu
      LoadData.LoadColor(map);
    });
  };

  static getLastSourceInfo = (map) => {
    const layers = map.getStyle().layers || [];

    // Lọc ra các layer có id bắt đầu bằng 'layer-' và có source đi kèm
    const layerWithSources = layers
      .filter((l) => l.id.startsWith("layer-") && l.source)
      .map((l) => ({ layerId: l.id, sourceId: l.source }));

    // Lấy layer cuối cùng trong danh sách
    return layerWithSources.length
      ? layerWithSources[layerWithSources.length - 1]
      : null;
  };

  static findSourceWithPathType(map) {
    if (!map || !map.getStyle()?.sources) return null;

    const allSources = Object.keys(map.getStyle().sources).filter((id) =>
      id.startsWith("source-")
    );

    for (const sourceId of allSources) {
      const source = map.getSource(sourceId);
      if (!source) continue;

      const features =
        source._data?.features ||
        source._options?.data?.features ||
        source.data?.features;

      if (!features?.length) continue;

      const found = features.find((f) => isPathElement(f));

      if (found) {
        return sourceId; // ✅ Trả về sourceId đầu tiên tìm được
      }
    }

    return null; // ❌ Không tìm thấy
  }

  static SaveAndLoadData = (draw, map, isPathRef) => {
    const terraDraw = draw.getTerraDrawInstance();

    terraDraw.on("finish", () => {
      if (isPathRef.current) return;

      const drawFeatures = draw.getFeatures().features;
      let geojson = loadFromLocalStorage();
      if (!geojson) {
        geojson = {
          type: "FeatureCollection",
          features: [],
        };
      }

      const featuresNotAvailable = drawFeatures.filter(
        (item) => !geojson.features.some((bItem) => bItem.id === item.id)
      );

      const newIndex = AppGlobals.getMaxIndex() + 1;

      const updatedFeatures = featuresNotAvailable.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          id: f.id,
          color: f.properties?.color ?? "#787878",
          height: f.properties?.height ?? 0,
          label: f.properties?.label ?? "",
          index: newIndex,
          layer: f.properties?.layer ?? "",
          type: f.geometry?.type ?? "",
        },
      }));

      const allFeatures = [...geojson.features, ...updatedFeatures];

      // 👉 Chỉ add nếu chưa có
      const lastSourceInfo = this.getLastSourceInfo(map);
      const lastSource = lastSourceInfo
        ? map.getSource(lastSourceInfo.sourceId)
        : null;

      // Lấy data hiện tại trong source cuối (nếu có)
      const currentData = lastSource?._data || lastSource?._options?.data;
      const currentFeatures = currentData?.features || [];

      updatedFeatures.forEach((f) => {
        // Nếu có source cuối và cùng loại geometry → append vào source đó
        if (
          lastSource &&
          currentFeatures.length > 0 &&
          currentFeatures[0].geometry.type === f.geometry.type
        ) {
          const merged = {
            type: "FeatureCollection",
            features: [...currentFeatures, f],
          };
          lastSource.setData(merged);
        } else {
          const index = generateUUID();
          const geojson = {
            type: "FeatureCollection",
            sourceType: f.geometry.type,
            features: [f],
          };
          // Tạo source mới
          LoadData.AddFeature(geojson, map, index);
        }
      });

      terraDraw.clear();
      // terraDraw.stop();

      AppGlobals.setDataToStore(updatedFeatures[0]);

      saveToLocalStorage({
        type: "FeatureCollection",
        features: allFeatures,
      });
    });
  };

  static SaveAndLoadPath = (draw, map, isPathRef) => {
    const terraDraw = draw.getTerraDrawInstance();

    let startPointPath = null;

    terraDraw.on("change", () => {
      if (!isPathRef.current) return;

      const all = draw.getFeatures().features;
      const current = all.find((f) => f.geometry.type === "LineString");
      const pathSourceInfo = this.findSourceWithPathType(map);
      const lastSource = pathSourceInfo ? map.getSource(pathSourceInfo) : null;

      if (!current || !lastSource) return;
      const coords = current.geometry.coordinates;

      const sourceData = lastSource._data || lastSource._options?.data;
      const coordinatesElementPath =
        sourceData?.features?.[0].geometry.coordinates;

      // 👉 Khi user mới click 1 điểm (bắt đầu vẽ)
      if (coords.length > 0) {
        const startPoint = coords[0];

        // const distance = 0.00005;
        const zoom = map.getZoom();
        const distance = 0.005 / Math.pow(2, zoom - 10);

        const nearPoint = DistanceElement.isPointNearAnySegment(
          startPoint,
          coordinatesElementPath,
          distance
        );

        if (!nearPoint) {
          setTimeout(() => {
            terraDraw.clear();
          }, 0);
          return;
        }
        // console.log("Có gần đoạn nào không?", nearPoint);
        startPointPath = nearPoint;
      }
    });

    terraDraw.on("finish", () => {
      if (!isPathRef.current) return;

      const drawFeatures = draw.getFeatures().features;
      let geojson = AppGlobals.getElements();

      const featuresNotAvailable = drawFeatures.filter(
        (item) => !geojson.some((bItem) => bItem.id === item.id)
      );

      const newIndex = AppGlobals.getMaxIndex() + 1;

      const updatedFeatures = featuresNotAvailable.map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          id: f.id,
          color: f.properties?.color ?? "#787878",
          height: f.properties?.height ?? 0,
          label: f.properties?.label ?? "",
          index: newIndex,
          layer: f.properties?.layer ?? "",
          type: "Path",
        },
      }));

      // 👉 Chỉ add nếu chưa có
      const pathSourceInfo = this.findSourceWithPathType(map);
      const lastSource = pathSourceInfo ? map.getSource(pathSourceInfo) : null;

      updatedFeatures.forEach((f) => {
        const oldCoordinates = f.geometry.coordinates;
        if (!lastSource) {
          // 👈 Nếu chưa có source Path, tạo mới
          const index = generateUUID();
          const geojson = {
            type: "FeatureCollection",
            sourceType: "Path",
            features: [
              {
                ...f,
                geometry: {
                  type: "MultiLineString",
                  coordinates: [oldCoordinates],
                },
                properties: {
                  ...f.properties,
                  mode: "MultiLineString",
                },
              },
            ],
          };
          LoadData.AddFeature(geojson, map, index);
          AppGlobals.setDataToStore(geojson.features[0]);
        } else {
          // 👈 Nếu đã có source Path → thêm đoạn vào MultiLineString hiện tại
          const sourceData = lastSource._data || lastSource._options?.data;
          const feature = sourceData?.features?.[0];

          if (feature?.geometry?.type === "MultiLineString") {
            const [segA, segB] = startPointPath.segment;
            const insertPoint = startPointPath.point;

            // Duyệt qua từng đoạn (LineString con)
            for (const line of feature.geometry.coordinates) {
              const index = line.findIndex((point, i) => {
                if (i === line.length - 1) return false;
                const next = line[i + 1];
                return (
                  (point[0] === segA[0] &&
                    point[1] === segA[1] &&
                    next[0] === segB[0] &&
                    next[1] === segB[1]) ||
                  (point[0] === segB[0] &&
                    point[1] === segB[1] &&
                    next[0] === segA[0] &&
                    next[1] === segA[1])
                );
              });

              if (index !== -1) {
                // Nếu tìm được đoạn phù hợp, chèn điểm vào giữa
                line.splice(index + 1, 0, insertPoint);
                break; // Thoát vòng lặp vì đã thêm xong
              }
            }

            const newCoords = oldCoordinates.slice(1);
            const newCoordinates = [insertPoint, ...newCoords];
            feature.geometry.coordinates.push(newCoordinates); // ➕ Add đoạn mới

            // Cập nhật dữ liệu lên map và vào store
            lastSource.setData(sourceData);
            AppGlobals.setDataToStore(feature);
          }
        }
      });

      terraDraw.clear();
      // terraDraw.stop();
    });
  };
}
