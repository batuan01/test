export class AppGlobals {
  static elements = [];

  static getElements() {
    return this.elements;
  }

  static setElements(value) {
    this.elements = value;
  }

  static setDataToStore(data) {
    if (!data) return;

    const index = this.elements.findIndex((f) => f.id === data.id);

    if (index !== -1) {
      this.elements[index] = data; // cập nhật nếu đã có
    } else {
      this.elements.push(data); // thêm mới nếu chưa có
    }
  }

  static setAllDataToStore(data) {
    if (!data) return;
    this.elements = data;
  }

  static updateDataStoreByIds(id1, id2) {
    const features = this.getElements();
    if (!features || !Array.isArray(features)) return;

    const index1 = features.findIndex((f) => f.id === id1);
    const index2 = features.findIndex((f) => f.id === id2);

    if (index1 === -1 || index2 === -1) return;

    // Hoán đổi vị trí trong mảng
    const temp = features[index1];
    features[index1] = features[index2];
    features[index2] = temp;

    // Hoán đổi index trong properties
    const idx1 = features[index1].properties.index;
    const idx2 = features[index2].properties.index;
    features[index1].properties.index = idx2;
    features[index2].properties.index = idx1;

    this.setAllDataToStore(features);
  }

  static removeDataById(id) {
    if (!id) return;

    const index = this.elements.findIndex((f) => f.id === id);
    if (index !== -1) {
      this.elements.splice(index, 1); // Xóa phần tử tại vị trí index
    }
  }

  static getRelativeId(id, condition = "forward") {
    const index = this.elements.findIndex((f) => f.id === id);
    if (index === -1) return null;

    let targetIndex = condition === "forward" ? index + 1 : index - 1;

    if (targetIndex < 0 || targetIndex >= this.elements.length) return null;

    return this.elements[targetIndex]?.id || null;
  }

  static getMaxIndex() {
    return this.elements.length
      ? Math.max(...this.elements.map((f) => Number(f.properties.index)))
      : 0;
  }

  static getAdjacentFeature(feature, direction) {
    if (!feature?.properties?.index) return null;

    const currentIndex = Number(feature.properties.index);
    const isForward = direction === "forward";

    const candidates = this.elements
      .filter((f) => {
        const idx = Number(f.properties?.index);
        if (isNaN(idx)) return false;
        return isForward ? idx > currentIndex : idx < currentIndex;
      })
      .sort((a, b) =>
        isForward
          ? a.properties.index - b.properties.index
          : b.properties.index - a.properties.index
      );

    return candidates[0] || null;
  }
}
