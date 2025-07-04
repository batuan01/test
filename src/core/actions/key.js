import { clearLocalStorage } from "../utils";

export class Keyboard {
  static keyDown(mapContainer, drawRef) {
    const handleKeyDown = (e) => {
      const mapEl = mapContainer.current;
      const activeEl = document.activeElement;

      // Chỉ xử lý nếu focus đang nằm trong map container
      if (!mapEl || !mapEl.contains(activeEl)) return;

      // Ctrl + A: chọn tất cả
      if (e.ctrlKey && e.key === "a") {
        e.preventDefault();
        this.selectAllFeatures(drawRef);
      }

      // Backspace: xóa hết
      if (e.key === "Backspace") {
        e.preventDefault();
        console.log(345);
        // clearAllFeatures(map);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }

  static selectAllFeatures(drawRef) {
    const draw = drawRef.current;
    if (!draw) return;

    const terraDraw = draw.getTerraDrawInstance();
    const allFeatures = draw.getFeatures().features;

    if (!allFeatures.length) return;

    // Lấy danh sách ID các features
    const ids = allFeatures.map((f) => f.id);

    // Chuyển sang chế độ select
    terraDraw.setMode("select", {
      featureIds: ids,
    });
  }
}

export const clearAllFeatures = (map, features) => {
  // features.forEach((f) => {
  //   map.removeLayer();
  //   map.removeSource();
  // });
  // // Xóa luôn trong localStorage nếu bạn đang lưu ở đó
  // clearLocalStorage();
};
