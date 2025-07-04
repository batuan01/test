import {
  calculateImageBoundsWithAspect,
  generateUUID,
  loadFromLocalStorage,
  newDataToLocalStorage,
  saveToLocalStorage,
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

          const imageFeature = {
            type: "Feature",
            id: imageId,
            geometry: {
              type: "Image",
              coordinates: bounds,
            },
            properties: {
              type: "image",
              imageUrl: imageDataUrl,
            },
          };
          //   if (!map.hasImage(imageId)) {
          //     map.addImage(imageId, img, { pixelRatio: 1 });
          //   }

          LoadData.AddFeature(imageFeature, map);

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
}
