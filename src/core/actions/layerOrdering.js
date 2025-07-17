import { AppGlobals } from "../globals";
import { generateUUID } from "../utils";
import { isImageElement } from "./element/typeChecks";
import { LayerActions } from "./layerActions";
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
        LayerActions.removeLayer(map, layer);
      }

      if (map.getSource(fromSourceId)) map.removeSource(fromSourceId);
    }
  }

  static moveLayer = (map, feature, direction) => {
    const currentSourceId = LayerActions.findFeatureSourceId(map, feature);
    const currentLayerId = LayerActions.findFeatureLayerId(map, feature);

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

      const fromFeature = LayerActions.findFeatureLayerId(
        map,
        reordered[index]
      );
      const toFeature = LayerActions.findFeatureLayerId(
        map,
        reordered[newIndex]
      );

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
    const relativeSourceId = LayerActions.findFeatureSourceId(
      map,
      relativeFeature
    );
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

    if (isImageElement(relativeFeature)) {
      const aboveFeature = AppGlobals.getAdjacentFeature(
        relativeFeature,
        direction
      );
      const aboveSourceId = LayerActions.findFeatureSourceId(map, aboveFeature);

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
          if (isImageElement(feature)) {
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
          if (isImageElement(feature)) {
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
        const targetSourceId = LayerActions.findFeatureSourceId(
          map,
          newFeature
        );
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
        if (isImageElement(relativeFeature)) {
          this.removeLayer(map, relativeFeature.id);
        }

        const layerId = isForward
          ? currentLayerId[0]
          : newFeature
          ? LayerActions.findFeatureLayerId(map, newFeature)?.[0]
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

  static removeLayer(map, layerId) {
    const currentLayerId = [`layer-${layerId}`, `layer-outline-${layerId}`];
    const currentSourceId = `source-${layerId}`;

    for (const layer of currentLayerId) {
      LayerActions.removeLayer(map, layer);
    }
    LayerActions.removeSource(map, currentSourceId);
  }

  static updateDataAftermove(map, feature, currentSourceId) {
    if (!isImageElement(feature)) {
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
