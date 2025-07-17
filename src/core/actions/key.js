import { AppGlobals } from "../globals";
import { removeFeatureFromLocalStorage } from "../utils";
import { BoundingBox } from "./boundingBox";
import { isImageElement } from "./element/typeChecks";
import { HandleDragging } from "./handlesPoint";
import { LayerActions } from "./layerActions";
import { LayerOrdering } from "./layerOrdering";
import { RemovePoint } from "./removePoint";
import { RotateController } from "./rotateElement";

export class Keyboard {
  static selectedMultipleElements = [];
  static keyDown(mapContainer, mapRef, selectedElement) {
    const handleKeyDown = (e) => {
      const mapEl = mapContainer.current;
      const activeEl = document.activeElement;

      // Chỉ xử lý nếu focus đang nằm trong map container
      if (!mapEl || !mapEl.contains(activeEl)) return;

      // Ctrl + A: chọn tất cả
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        this.selectedMultipleElements = AppGlobals.getElements();
      }

      // Backspace: xóa hết
      if (e.key === "Backspace") {
        e.preventDefault();
        const map = mapRef.current;
        if (RemovePoint.targetPoint) {
          RemovePoint.removeOnlyPoint(map);
          return;
        }

        if (selectedElement) {
          clearAllFeatures(map, [selectedElement]);
          AppGlobals.removeDataById(selectedElement.id);
        }

        if (this.selectedMultipleElements.length) {
          clearAllFeatures(map, this.selectedMultipleElements);
          this.selectedMultipleElements = [];
          AppGlobals.setElements([]);
        }

        HandleDragging.removeHandlesPoint(map);
        BoundingBox.clearBoundingBox(map, "selected");
        BoundingBox.clearBoundingBox(map, "hover");
        RotateController.destroy(map);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }
}

export const clearAllFeatures = (map, features) => {
  if (!features.length) return;

  features.forEach((f) => {
    const currentSourceId = LayerActions.findFeatureSourceId(map, f);

    if (!isImageElement(f)) {
      LayerOrdering.updateDataAftermove(map, f, currentSourceId);
      removeFeatureFromLocalStorage(f.id);
    } else {
      LayerOrdering.removeLayer(map, f.id);
      removeFeatureFromLocalStorage(f.id);
    }
  });
};
