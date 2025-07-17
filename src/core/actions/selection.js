import { isImageElement } from "./element/typeChecks";
import { HandleDragging } from "./handlesPoint";

export class Selection {
  // static setSelectedData(map, data) {
  //   if (data && !map.getSource(`source-${data.id}`)) return;
  //   map.getSource(`source-${data.id}`).setData({
  //     type: "FeatureCollection",
  //     features: [data],
  //   });
  // }

  static setSelectedData(map, data, sourceId) {
    const id = sourceId ?? (data.source || `source-${data.id}`);
    const source = map.getSource(id);
    if (!source) return;

    // Nếu là ảnh raster (image)
    if (isImageElement(data)) {
      const coordinates = data.geometry?.coordinates;

      // Chỉ cập nhật nếu source là type: 'image'
      if (source.setCoordinates && coordinates) {
        try {
          source.setCoordinates(coordinates);
        } catch (err) {
          console.warn("Không thể cập nhật ảnh:", err);
        }
      }

      return; // kết thúc ở đây nếu là ảnh
    }

    // Trường hợp GeoJSON (Polygon, LineString, ...)
    const currentData = source._data || source._options?.data;
    if (!currentData || !currentData.features) return;

    const updatedFeatures = currentData.features.map((feature) => {
      return feature.id === data.id ? data : feature;
    });

    const newData = {
      type: "FeatureCollection",
      features: updatedFeatures,
    };

    source.setData(newData);
  }

  static setHandlesData(map, data) {
    if (data && !map.getSource("handles-source")) return;
    const newHandles = HandleDragging.getCornerHandles(data);
    map.getSource("handles-source").setData({
      type: "FeatureCollection",
      features: newHandles,
    });
  }
}
