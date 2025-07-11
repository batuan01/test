import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import {
  generateUUID,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "../utils";
import { LoadData } from "./loadData";
import { AppGlobals } from "../globals";

export class DrawElement {
  static Terradraw = (map, drawRef) => {
    map.on("load", () => {
      const draw = new MaplibreTerradrawControl({
        modes: [
          "render",
          "point",
          "linestring",
          "polygon",
          "rectangle",
          "circle",
          "freehand",
          "angled-rectangle",
          "sensor",
          "sector",
        ],
        open: true,
      });

      map.addControl(draw, "top-left");
      drawRef.current = draw;

      // 🔁 Lắng nghe thay đổi và tự động lưu
      this.SaveAndLoadData(draw, map);

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

  static newIndexSource = (map) => {
    const lastSourceInfo = this.getLastSourceInfo(map);
    const index = lastSourceInfo
      ? Number(lastSourceInfo.layerId.match(/\d+$/)?.[0])
      : 0;
    return index + 1;
  };

  static SaveAndLoadData = (draw, map) => {
    const terraDraw = draw.getTerraDrawInstance();

    terraDraw.on("finish", () => {
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
}
