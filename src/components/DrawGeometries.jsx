// MapDraw.tsx
import { useContext, useEffect, useRef, useState } from "react";

// @ts-ignore: TerraDraw is a UMD global so we import it this way
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { MapContext } from "../contexts/mapContext";
import { BoundingBox } from "../core/actions/boundingBox";
import { DrawElement } from "../core/actions/draw";
import { Keyboard } from "../core/actions/key";
import { LoadData } from "../core/actions/loadData";
import { createMap } from "../core/actions/map";
import { ContextMenuOption } from "../core/actions/rightMouse";
import { SelectedSelection } from "../core/actions/selectedElement";
import { BasicComponent } from "./2d/right-panel/BasicComponent";
import CustomToolbar from "./bottom-panel/CustomToolbar";
import maplibregl from "maplibre-gl";

const DrawGeometries = () => {
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapContainer = useRef(null);
  const drawRef = useRef(null);
  const isPathRef = useRef(false);
  const [hide, setHide] = useState(true);
  const positionRef = useRef(null);

  const { selectedElement, setSelectedElement } = useContext(MapContext);

  useEffect(() => {
    const map = createMap({
      mapContainer: mapContainer.current,
      bearing: -33.5,
    });

    mapRef.current = map;
    map.doubleClickZoom.disable();
    // map.dragPan.disable();

    DrawElement.Terradraw(map, drawRef, isPathRef);

    map.on("click", (e) => {
      // const selected = drawRef.current.getFeatures(true).features;
      // if (selected.length) {
      //   const feature = selected[0];
      //   const height = feature.properties?.height ?? "";
      //   setHeight(Number(height));
      // } else {
      //   setHeight("");
      // }
    });

    SelectedSelection.getSelectedElement({ map, setSelectedElement });
    SelectedSelection.getDoubleClickSelection({ map, setSelectedElement });

    map.on("load", () => {
      LoadData.loadDefaultData(map);
      BoundingBox.hoverBBoxSelected(selectedElement, mapRef.current);
    });

    ContextMenuOption.initRightMouse(map);

    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true, // ưu tiên GPS chính xác
      },
      trackUserLocation: false, // không theo dõi liên tục
      // showUserLocation: false, // ẩn marker mặc định
      // showAccuracyCircle: false, // tắt vòng tròn bán kính
    });

    // Thêm control vào map
    map.addControl(geolocate);

    // Khi control sẵn sàng, gọi để lấy vị trí
    map.once("load", () => {
      geolocate.trigger(); // yêu cầu lấy vị trí ngay
    });

    // Lắng nghe sự kiện lấy được vị trí
    geolocate.on("geolocate", (pos) => {
      positionRef.current = pos; // Lưu lại để nút bấm dùng
      console.log("Đã cập nhật vị trí:", pos.coords);
    });

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    Keyboard.keyDown(mapContainer, mapRef, selectedElement);
  }, [selectedElement]);

  // Hide context menu when click outside
  document.addEventListener("click", () => {
    const existing = document.getElementById("map-context-menu");
    if (existing) existing.remove();
  });

  useEffect(() => {
    setHide(!selectedElement);
  }, [selectedElement]);

  const handleLogAccuracy = () => {
    if (positionRef.current) {
      alert(`Accuracy: ±${positionRef.current.coords.accuracy} mét`);
    } else {
      console.warn("Chưa có dữ liệu vị trí!");
    }
  };

  const handleLogLatLng = () => {
    if (positionRef.current) {
      alert("lat " + positionRef.current.coords.latitude);
      alert("lng " + positionRef.current.coords.longitude);
    } else {
      console.warn("Chưa có dữ liệu vị trí!");
    }
  };

  return (
    <div style={{ position: "relative", height: "100vh" }}>
      <div ref={mapContainer} style={{ height: "100%" }} />

      <ButtonShow onClick={() => setHide(!hide)}>Show</ButtonShow>
      {/* {!hide && ( */}
      <FormProperty>
        {/* <BasicComponent mapRef={mapRef} mapContainer={mapContainer} /> */}
        <ButtonLog onClick={() => handleLogAccuracy()}>log accuracy</ButtonLog>
        <ButtonLog onClick={() => handleLogLatLng()}>log lat lng</ButtonLog>
      </FormProperty>
      {/* )} */}

      <CustomToolbar drawRef={drawRef} mapRef={mapRef} isPathRef={isPathRef} />
    </div>
  );
};

export default DrawGeometries;

const FormProperty = styled.div`
  position: absolute;
  top: 40px;
  right: 10px;
  width: 300px;
  text-align: center;
`;

const ButtonShow = styled.button`
  padding: 0.6rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  position: absolute;
  top: 2px;
  right: 10px;
  z-index: 2;

  &:hover {
    background: #0056b3;
  }
`;

const ButtonLog = styled.button`
  padding: 0.6rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  top: 2px;
  right: 10px;
  z-index: 2;

  &:hover {
    background: #0056b3;
  }
`;
