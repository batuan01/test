import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { loadFromLocalStorage, saveToLocalStorage } from "../utils";
import {
  createBBoxHandles,
  hoverBBoxSelected,
  renderBBoxHandles,
} from "./boundingBox";
import {
  drawScaleHandles,
  clearScaleHandles,
  onHandleMouseDown,
  onHandleMouseMove,
  onHandleMouseUp,
  setupCornerHandlers,
} from "./scale";
import { LoadData } from "./loadData";

export const TerradrawAction = (map, drawRef) => {
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
        "select",
        "delete-selection",
        "delete",
        "download",
      ],
      open: true,
    });

    map.addControl(draw, "top-left");
    drawRef.current = draw;

    // 🔁 Lắng nghe thay đổi và tự động lưu
    SaveAndLoadData(draw, map);

    // 🔁 Lắng nghe thay đổi màu
    LoadData.LoadColor(map);
  });
};

export const SaveAndLoadData = (draw, map) => {
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

    const updatedFeatures = featuresNotAvailable.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        color: f.properties?.color ?? "#787878",
        height: f.properties?.height ?? 0,
        label: f.properties?.label ?? "",
      },
    }));

    const allFeatures = [...geojson.features, ...updatedFeatures];

    saveToLocalStorage({
      type: "FeatureCollection",
      features: allFeatures,
    });
  });
};
