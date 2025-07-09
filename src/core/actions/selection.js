import { HandleDragging } from "./handlesPoint";

export class Selection {
  // static setSelectedData(map, data) {
  //   if (data && !map.getSource(`source-${data.id}`)) return;
  //   map.getSource(`source-${data.id}`).setData({
  //     type: "FeatureCollection",
  //     features: [data],
  //   });
  // }

  static lastDataStr = "";

  static setSelectedData(map, data) {
    const sourceId = `source-${data.id}`;
    const source = map.getSource(sourceId);
    if (!source) return;

    const newData = {
      type: "FeatureCollection",
      features: [data],
    };

    const newDataStr = JSON.stringify(newData);
    if (this.lastDataStr === newDataStr) return;

    this.lastDataStr = newDataStr;
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
