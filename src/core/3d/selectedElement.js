import { Marker } from "maplibre-gl";
import { isPathElement } from "../actions/element/typeChecks";
import { SelectedSelection } from "../actions/selectedElement";
import { AppGlobals } from "../globals";
import { ConvertData } from "./convertData";

export class SelectedElement {
  static getSelectedData({ map, setSelectedElement }) {
    let currentMarker = null; // 👉 Lưu marker hiện tại

    map.on("click", (e) => {
      const clickedLngLat = [e.lngLat.lng, e.lngLat.lat];
      const storedData = AppGlobals.getElements();
      if (!storedData?.length) return;

      const featureNotPath = storedData.filter((f) => !isPathElement(f));

      const feature = SelectedSelection.findFeatureAtPoint(
        clickedLngLat,
        featureNotPath
      );

      // 👉 Xóa marker cũ nếu có
      if (currentMarker) {
        currentMarker.remove();
        currentMarker = null;
      }

      if (feature) {
        setSelectedElement(feature);

        const convertCenter = ConvertData.convertLabel([feature]);
        const coordinate = convertCenter[0].geometry.coordinates;

        currentMarker = new Marker({
          draggable: true,
        })
          .setLngLat(coordinate)
          .addTo(map); // Lưu lại marker
      } else {
        setSelectedElement(null);
      }
    });
  }
}
