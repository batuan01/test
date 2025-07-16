import maplibregl from "maplibre-gl";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { ImageElement } from "../../core/actions/image";
import { DEFAULT_COORDINATES } from "../../core/utils";
import { Icons } from "../../icons/icon";
import { DrawElement } from "../../core/actions/draw";
import { LoadData } from "../../core/actions/loadData";

export default function CustomToolbar({ drawRef, mapRef, isPathRef }) {
  const navigate = useNavigate();
  const location = useLocation();
  const is3D = location.pathname.includes("3d");

  const [selectedControl, setSelectedControl] = useState("pointer");
  const [viewMode, setViewMode] = useState(is3D ? "3d" : "2d");
  const [zoom, setZoom] = useState("");

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    const map = mapRef.current;
    if (!file || !map) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result;

      ImageElement.add(map, imageDataUrl);
    };

    reader.readAsDataURL(file);
  };

  const handleSelect = (tool) => {
    const draw = drawRef.current;
    const map = mapRef.current;
    if (!draw) return;
    const terraDraw = draw.getTerraDrawInstance();

    setSelectedControl(tool);

    // Mặc định: không phải path
    isPathRef.current = false;

    switch (tool) {
      case "pointer":
      case "hand":
      case "image":
        terraDraw.setMode("render");
        break;

      case "point":
        terraDraw.setMode("point");
        break;

      case "line":
        terraDraw.setMode("linestring");
        LoadData.LoadColor(map);
        break;

      case "polygon":
        terraDraw.setMode("polygon");
        LoadData.LoadColor(map);
        break;

      case "circle":
        terraDraw.setMode("circle");
        break;

      case "path":
        isPathRef.current = true;
        map.setPaintProperty("td-linestring", "line-color", "#1c7ed6");
        terraDraw.setMode("linestring");
        break;

      default:
        terraDraw.setMode("render");
        break;
    }
  };

  const handleToggle = (mode) => {
    setViewMode(mode);
    navigate(is3D ? "/" : "/3d");
  };

  function getBounds(coordinates) {
    const bounds = new maplibregl.LngLatBounds();
    bounds.extend(coordinates);
    return bounds;
  }

  const handleZoomChange = (e) => {
    const value = e.target.value;
    const map = mapRef.current;
    if (!map) return;

    switch (value) {
      case "in":
        map.zoomIn();
        break;

      case "out":
        map.zoomOut();
        break;

      case "fit": {
        const bearing = map.getBearing();
        const bounds = getBounds(DEFAULT_COORDINATES);
        map.easeTo({
          center: bounds.getCenter(),
          zoom: 17, // bạn có thể tính hoặc dùng zoom hiện tại
          bearing, // 👈 giữ nguyên bearing
          pitch: map.getPitch(), // giữ nguyên pitch nếu cần
          duration: 500,
        });
        break;
      }

      default: {
        map.setZoom(15);
        break;
      }
    }

    // Cập nhật state nếu cần
    setZoom("");
  };

  return (
    <ToolbarWrapper>
      {!is3D && (
        <ButtonWrapper>
          <IconButton
            $selected={selectedControl === "pointer"}
            onClick={() => handleSelect("pointer")}
          >
            <Icons.Pointer />
          </IconButton>
          <IconButton
            $selected={selectedControl === "hand"}
            onClick={() => handleSelect("hand")}
          >
            <Icons.Hand />
          </IconButton>
          <IconButton
            $selected={selectedControl === "point"}
            onClick={() => handleSelect("point")}
          >
            <Icons.Point />
          </IconButton>
          <IconButton
            $selected={selectedControl === "line"}
            onClick={() => handleSelect("line")}
          >
            <Icons.Line />
          </IconButton>
          <IconButton
            $selected={selectedControl === "polygon"}
            onClick={() => handleSelect("polygon")}
          >
            <Icons.Polygon />
          </IconButton>
          <IconButton
            $selected={selectedControl === "circle"}
            onClick={() => handleSelect("circle")}
          >
            <Icons.Circle />
          </IconButton>
          <IconButton
            as="label"
            htmlFor="upload"
            $selected={selectedControl === "image"}
          >
            <Icons.Image />
          </IconButton>
          <input
            id="upload"
            type="file"
            accept="image/*"
            onChange={handleUploadImage}
            onClick={() => handleSelect("image")}
            style={{ display: "none" }}
          />
          <IconButton
            $selected={selectedControl === "path"}
            onClick={() => handleSelect("path")}
          >
            <Icons.Path />
          </IconButton>
        </ButtonWrapper>
      )}

      <ZoomSelect onChange={handleZoomChange} value={zoom}>
        <option value="" disabled>
          Zoom
        </option>
        <option value="100">100%</option>
        <option value="out">Zoom Out</option>
        <option value="in">Zoom In</option>
        <option value="fit">Zoom To Fit</option>
      </ZoomSelect>

      <ToggleSwitch>
        <ToggleButton
          $active={viewMode === "2d"}
          onClick={() => handleToggle("2d")}
        >
          2D
        </ToggleButton>
        <ToggleButton
          $active={viewMode === "3d"}
          onClick={() => handleToggle("3d")}
        >
          3D
        </ToggleButton>
      </ToggleSwitch>
    </ToolbarWrapper>
  );
}

// Container chính
const ToolbarWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  background: white;
  border: 1px solid #ddd;
  border-radius: 999px;
  padding: 6px 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 6px;
  z-index: 1000;
`;

// Nút icon bo tròn
const IconButton = styled.button`
  background: transparent;
  border: none;
  padding: 8px;
  border-radius: 8px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (props.$selected ? "#1c7ed6" : "transparent")};

  svg,
  g {
    fill: ${(props) => (props.$selected ? "white" : "#1c7ed6")};
  }
`;

// Dropdown zoom %
const ZoomSelect = styled.select`
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  font-size: 14px;

  &:hover {
    background-color: #f5f5f5;
  }

  &:focus {
    outline: none;
  }
`;

// Toggle 2D/3D switch
const ToggleSwitch = styled.div`
  display: flex;
  border: 1px solid #ccc;
  border-radius: 999px;
  overflow: hidden;
`;

const ButtonWrapper = styled.div`
  display: flex;
  overflow: hidden;

  label {
    width: auto;
    height: auto;
  }
`;

const ToggleButton = styled.button`
  padding: 6px 12px;
  font-size: 14px;
  font-weight: bold;
  background-color: ${(props) => (props.$active ? "#e0edff" : "transparent")};
  color: ${(props) => (props.$active ? "#1c7ed6" : "#999")};
  border: none;
  cursor: pointer;
`;
