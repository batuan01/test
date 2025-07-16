import { AppGlobals } from "../globals";
import { generateUUID } from "../utils";
import { LoadData } from "./loadData";

export class LayerOrdering {
  static bringForward(map, feature) {
    this.moveLayer(map, feature, "forward");
  }

  static sendBackward(map, feature) {
    this.moveLayer(map, feature, "backward");
  }

  static moveFeature(
    map,
    feature,
    fromSourceId,
    toSourceId,
    direction,
    currentLayerId
  ) {
    const fromSource = map.getSource(fromSourceId);
    const toSource = map.getSource(toSourceId);

    const fromData = fromSource._data || fromSource._options?.data;
    const toData = toSource._data || toSource._options?.data;

    if (!fromData?.features || !toData?.features) return;

    const newFrom = fromData.features.filter((f) => f.id !== feature.id);
    const newTo =
      direction === "forward"
        ? [feature, ...toData.features]
        : [...toData.features, feature];

    fromSource.setData({ type: "FeatureCollection", features: newFrom });
    toSource.setData({ type: "FeatureCollection", features: newTo });

    // Nếu source cũ không còn feature nào → xóa
    if (newFrom.length === 0) {
      for (const layer of currentLayerId) {
        if (map.getLayer(layer)) map.removeLayer(layer);
      }

      if (map.getSource(fromSourceId)) map.removeSource(fromSourceId);
    }
  }

  static moveLayer = (map, feature, direction) => {
    const currentSourceId = this.findFeatureSourceId(map, feature);
    const currentLayerId = this.findFeatureLayerId(map, feature);

    if (!currentSourceId || !currentLayerId.length) return;

    const storedData = AppGlobals.getElements();
    const isAtBottom = storedData[0]?.id === feature.id;
    const isAtTop = storedData[storedData.length - 1]?.id === feature.id;

    if (
      (direction === "forward" && isAtTop) ||
      (direction === "backward" && isAtBottom)
    ) {
      // Feature đã nằm trên cùng hoặc dưới cùng → không làm gì
      return;
    }

    const source = map.getSource(currentSourceId);
    const data = source._data || source._options?.data;
    const features = data?.features || [];

    const index = features.findIndex((f) => f.id === feature.id);
    const delta = direction === "forward" ? 1 : -1;
    const newIndex = index + delta;

    // Nếu có thể di chuyển trong cùng 1 source
    if (newIndex >= 0 && newIndex < features.length) {
      const reordered = [...features];
      const temp = reordered[index];
      reordered[index] = reordered[newIndex];
      reordered[newIndex] = temp;

      const fromFeature = this.findFeatureLayerId(map, reordered[index]);
      const toFeature = this.findFeatureLayerId(map, reordered[newIndex]);

      if (map.getLayer(fromFeature[1]) && map.getLayer(toFeature[1])) {
        if (direction === "forward") {
          map.moveLayer(fromFeature[1], toFeature[1]);
        } else {
          map.moveLayer(toFeature[1], fromFeature[1]);
        }
      }

      source.setData({
        type: "FeatureCollection",
        features: reordered,
      });

      AppGlobals.updateDataStoreByIds(
        reordered[index].id,
        reordered[newIndex].id
      );
      return;
    }

    const relativeFeature = AppGlobals.getAdjacentFeature(feature, direction);
    const relativeSourceId = this.findFeatureSourceId(map, relativeFeature);
    const newFeature = (feature, index) => {
      return {
        ...feature,
        properties: {
          ...feature.properties,
          index: index ? index : feature.properties.index,
        },
      };
    };

    const newFeatureCollection = (feature, index) => {
      return {
        type: "FeatureCollection",
        sourceType: feature.geometry.type,
        features: [newFeature(feature, index)],
      };
    };

    const newIndexIncrease = AppGlobals.getMaxIndex() + 1;
    const newId = generateUUID();

    if (relativeFeature.geometry.type === "Image") {
      const aboveFeature = AppGlobals.getAdjacentFeature(
        relativeFeature,
        direction
      );
      const aboveSourceId = this.findFeatureSourceId(map, aboveFeature);

      const beforeLayerId =
        direction === "forward"
          ? aboveSourceId
            ? `layer-${aboveSourceId.replace("source-", "")}`
            : ""
          : `layer-${relativeSourceId.replace("source-", "")}`;

      if (aboveFeature?.geometry.type === feature.geometry.type) {
        this.moveFeature(
          map,
          feature,
          currentSourceId,
          aboveSourceId,
          direction,
          currentLayerId
        );
        AppGlobals.updateDataStoreByIds(relativeFeature.id, feature.id);
      } else {
        if (relativeFeature.properties.index === AppGlobals.getMaxIndex()) {
          if (feature.geometry.type === "Image") {
            this.removeLayer(map, feature.id);
          }

          LoadData.AddFeature(
            newFeatureCollection(feature, newIndexIncrease),
            map,
            newId,
            beforeLayerId
          );

          AppGlobals.removeDataById(feature.id);
          AppGlobals.setDataToStore(newFeature(feature, newIndexIncrease));
        } else {
          if (feature.geometry.type === "Image") {
            this.removeLayer(map, feature.id);
          }

          LoadData.AddFeature(
            newFeatureCollection(feature, relativeFeature.properties.index),
            map,
            newId,
            beforeLayerId
          );
          AppGlobals.updateDataStoreByIds(relativeFeature.id, feature.id);
        }
        this.updateDataAftermove(map, feature, currentSourceId);
      }
    } else {
      const isForward = direction === "forward";
      const newFeature = AppGlobals.getAdjacentFeature(
        feature,
        isForward ? "backward" : "forward"
      );

      const isSameType =
        newFeature &&
        newFeature.geometry.type === relativeFeature.geometry.type;

      if (isSameType) {
        const targetSourceId = this.findFeatureSourceId(map, newFeature);
        const source = map.getSource(targetSourceId);
        const data = source._data || source._options?.data;
        const features = data?.features || [];

        const reordered = isForward
          ? [...features, relativeFeature]
          : [relativeFeature, ...features];

        this.updateDataAftermove(map, relativeFeature, relativeSourceId);

        source.setData({
          type: "FeatureCollection",
          features: reordered,
        });
      } else {
        if (relativeFeature.geometry.type === "Image") {
          this.removeLayer(map, relativeFeature.id);
        }

        const layerId = isForward
          ? currentLayerId[0]
          : newFeature
          ? this.findFeatureLayerId(map, newFeature)?.[0]
          : "";

        LoadData.AddFeature(
          newFeatureCollection(relativeFeature, feature.properties.index),
          map,
          newId,
          layerId
        );

        this.updateDataAftermove(map, relativeFeature, relativeSourceId);
      }

      AppGlobals.updateDataStoreByIds(relativeFeature.id, feature.id);
    }
  };

  static findFeatureSourceId(map, feature) {
    if (!feature || !map || map.getStyle().sources.length === 0) return null;
    const allSources = Object.keys(map.getStyle().sources).filter((s) =>
      s.startsWith("source-")
    );
    const sourceId = allSources.find((sourceId) => {
      const source = map.getSource(sourceId);
      if (source.type === "image") {
        const id = source.id.replace("source-", "");
        return feature.id === id;
      }
      const data = source?._data || source?._options?.data || source?.data;
      return data?.features?.some((f) => f.id === feature.id);
    });

    return sourceId ?? "";
  }

  static findFeatureLayerId(map, feature) {
    const layers = map
      .getStyle()
      .layers.filter(
        (l) => l.id.startsWith("layer-") || l.id.startsWith("layer-outline-")
      );

    const currentSourceId = this.findFeatureSourceId(map, feature);
    const id = currentSourceId.replace("source-", "");

    let layerIds = [];
    for (const layer of layers) {
      let idLayer = layer.id;
      if (idLayer.startsWith("layer-outline-")) {
        idLayer = idLayer.replace("layer-outline-", "");
      } else if (idLayer.startsWith("layer-")) {
        idLayer = idLayer.replace("layer-", "");
      }

      if (idLayer === id && !layerIds.includes(layer.id)) {
        layerIds.push(layer.id);
      }
    }

    return layerIds;
  }

  static removeLayer(map, layerId) {
    const currentLayerId = [`layer-${layerId}`, `layer-outline-${layerId}`];
    const currentSourceId = `source-${layerId}`;

    for (const layer of currentLayerId) {
      if (map.getLayer(layer)) map.removeLayer(layer);
    }
    if (map.getSource(currentSourceId)) map.removeSource(currentSourceId);
  }

  static updateDataAftermove(map, feature, currentSourceId) {
    if (feature.geometry.type !== "Image") {
      const fromSource = map.getSource(currentSourceId);
      if (!fromSource) return;
      const fromData = fromSource._data || fromSource._options?.data;

      if (!fromData?.features) return;
      const newFrom = fromData.features.filter((f) => f.id !== feature.id);

      if (newFrom.length === 0) {
        const idLayer = currentSourceId.replace("source-", "");
        this.removeLayer(map, idLayer);
      }
      fromSource.setData({
        type: "FeatureCollection",
        features: newFrom,
      });
    }
  }
}
