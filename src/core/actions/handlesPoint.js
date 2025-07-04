import { loadFromLocalStorage, saveToLocalStorage } from "../utils";

export class HandleDragging {
  static getCornerHandles(feature) {
    if (!feature?.geometry) return [];

    let coordinates = [];

    if (feature.geometry.type === "Polygon") {
      coordinates = feature.geometry.coordinates[0]; // Vòng ngoài
    } else if (feature.geometry.type === "Image") {
      coordinates = [...feature.geometry.coordinates];
      if (
        coordinates.length &&
        (coordinates[0][0] !== coordinates.at(-1)[0] ||
          coordinates[0][1] !== coordinates.at(-1)[1])
      ) {
        coordinates.push(coordinates[0]);
      }
    }

    return coordinates.slice(0, -1).map((coord, idx) => ({
      type: "Feature",
      id: `${feature.id}-handle-${idx}`,
      geometry: {
        type: "Point",
        coordinates: coord,
      },
      properties: {
        type: "handle",
        parentId: feature.id,
        index: idx,
      },
    }));
  }

  static enableHandleDragging(map, onUpdateFeature) {
    let selectedHandle = null;
    let isDragging = false;

    map.on("mousedown", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["handles-layer"],
      });

      if (features.length && features[0].properties?.type === "handle") {
        selectedHandle = features[0];
        isDragging = true;
        map.getCanvas().style.cursor = "grabbing";
      }
    });

    map.on("mousemove", (e) => {
      if (!isDragging || !selectedHandle) return;

      const { parentId, index } = selectedHandle.properties;
      const newCoord = [e.lngLat.lng, e.lngLat.lat];

      const allFeatures = loadFromLocalStorage().features;
      const targetFeature = allFeatures.find((f) => f.id === parentId);
      if (!targetFeature) return;

      // Cập nhật vị trí điểm đang kéo
      let coords = [];
      if (targetFeature.geometry.type === "Polygon") {
        coords = [...targetFeature.geometry.coordinates[0]];
        coords[index] = newCoord;
        coords[coords.length - 1] = coords[0]; // đóng vòng
        targetFeature.geometry.coordinates = [coords];
      } else if (targetFeature.geometry.type === "Image") {
        coords = [...targetFeature.geometry.coordinates];
        coords[index] = newCoord;
        targetFeature.geometry.coordinates = coords;
      }

      // Gọi callback để cập nhật lại feature & re-render
      onUpdateFeature(targetFeature);
    });

    map.on("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        selectedHandle = null;
        map.getCanvas().style.cursor = "";
      }
    });
  }

  static addHandlesPoint = (map, handles) => {
    // 1. Add handles lên map
    if (!map.getSource("handles-source")) {
      map.addSource("handles-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: handles,
        },
      });
    }

    if (!map.getLayer("handles-layer")) {
      map.addLayer({
        id: "handles-layer",
        type: "circle",
        source: "handles-source",
        paint: {
          "circle-radius": 6,
          "circle-color": "#ff0000",
        },
      });
    }
  };

  static clearHandlesPoint = (map) => {
    const sourceId = "handles-source";
    const source = map.getSource(sourceId);

    if (source) {
      source.setData({
        type: "FeatureCollection",
        features: [],
      });
    }
  };

  static dragHandlesPoint = (map, targetPolygon) => {
    const handles = this.getCornerHandles(targetPolygon);
    this.addHandlesPoint(map, handles);

    this.enableHandleDragging(map, (updatedFeature) => {
      // Cập nhật lại feature trong localStorage
      const all = loadFromLocalStorage();
      const newFeatures = all.features.map((f) =>
        f.id === updatedFeature.id ? updatedFeature : f
      );
      saveToLocalStorage({
        type: "FeatureCollection",
        features: newFeatures,
      });

      // Cập nhật lại source trên map
      const sourceId = `source-${updatedFeature.id}`;
      if (map.getSource(sourceId)) {
        map.getSource(sourceId).setData(updatedFeature);
      }

      // Cập nhật lại handles
      const newHandles = this.getCornerHandles(updatedFeature);
      map.getSource("handles-source").setData({
        type: "FeatureCollection",
        features: newHandles,
      });
    });
  };
}
