import { AppGlobals } from "../globals";
import {
  calculateImageBoundsWithAspect,
  generateUUID,
  newDataToLocalStorage
} from "../utils";
import { LoadData } from "./loadData";

export class ImageElement {
  static add = (map, imageDataUrl) => {
    map.once("click", (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const imageId = generateUUID();
          const aspectRatio = img.naturalWidth / img.naturalHeight; // ví dụ 16/9
          const bounds = calculateImageBoundsWithAspect(
            e.lngLat,
            0.001,
            aspectRatio
          );

          const newIndex = AppGlobals.getMaxIndex() + 1;

          const imageFeature = {
            type: "Feature",
            id: imageId,
            geometry: {
              type: "Image",
              coordinates: bounds,
            },
            properties: {
              type: "Image",
              id: imageId,
              index: newIndex,
              imageUrl: imageDataUrl,
            },
          };

          const geojson = {
            type: "FeatureCollection",
            sourceType: "Image",
            features: [imageFeature],
          };

          LoadData.AddFeature(geojson, map, imageId);
          AppGlobals.setDataToStore(imageFeature);

          newDataToLocalStorage(imageFeature);
        } catch (err) {
          console.error("❌ Không thể thêm ảnh vào map:", err);
        }
      };

      // 👇 Bắt đầu tải ảnh (sẽ kích hoạt img.onload)
      img.src = imageDataUrl;
    });
  };

  static convertPoligon(feature) {
    return {
      ...feature,
      geometry: {
        ...feature.geometry,
        type: "Polygon",
        coordinates: [
          [...feature.geometry.coordinates, feature.geometry.coordinates[0]],
        ],
      },
    };
  }

  static convertImage(feature) {
    const coords = feature.geometry.coordinates?.[0];
    if (feature.geometry.type !== "Polygon" || !coords) return feature;

    const simplified =
      coords.length > 1 &&
      coords[0][0] === coords.at(-1)[0] &&
      coords[0][1] === coords.at(-1)[1]
        ? coords.slice(0, -1)
        : coords;

    return {
      ...feature,
      geometry: {
        type: "Image",
        coordinates: simplified,
      },
    };
  }
}
