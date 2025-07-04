import maplibregl from "maplibre-gl";

export const createMap = ({
  mapContainer,
  pitchWithRotate,
  dragRotate,
  pitch,
  bearing,
}) => {
  const map = new maplibregl.Map({
    container: mapContainer,
    style:
      "https://api.maptiler.com/maps/fefc1891-4e0d-4102-a51f-09768f839b85/style.json?key=S1qTEATai9KydkenOF6W",
    center: [139.7977668232757, 35.63168006521393],
    zoom: 16,
    pitchWithRotate: pitchWithRotate ?? false, // Không cho xoay bằng chuột phải + kéo
    dragRotate: dragRotate ?? false, // Không cho xoay bằng chuột
    touchPitch: false, // Không cho xoay bằng 2 ngón tay
    pitch: pitch ?? 0, // Góc nghiêng = 0 (2D)
    bearing: bearing ?? 0, // Không xoay hướng bản đồ
  });

  return map;
};
