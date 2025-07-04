import styled from "styled-components";
import {
  calculateImageBounds,
  loadFromLocalStorage,
  saveToLocalStorage,
} from "../../core/utils";
import { useContext, useState } from "react";
import { LoadData } from "../../core/actions/loadData";
import { ImageElement } from "../../core/actions/image";
import { selectedElement } from "../../core/actions/selectedElement";
import { MapContext } from "../../contexts/mapContext";

export const BasicComponent = ({ drawRef, height, setHeight, mapRef }) => {
  const [color, setColor] = useState("#787878");
  const { selectedElement, setSelectedElement } = useContext(MapContext);

  const updateSelectedFeatureHeight = (height) => {
    const draw = drawRef.current;
    if (!draw) return;

    const terraDraw = draw.getTerraDrawInstance();
    const selected = draw.getFeatures(true).features;

    if (!selected.length) return;

    const original = selected[0];

    // Tạo bản sao đã chỉnh sửa
    const updated = {
      ...original,
      properties: {
        ...original.properties,
        height: height,
      },
    };

    // ✅ Xóa feature cũ
    terraDraw.removeFeatures([original.id]);

    // ✅ Thêm lại feature đã chỉnh sửa
    terraDraw.addFeatures([updated]);

    // 🔁 Lưu lại toàn bộ features nếu cần
    const stored = loadFromLocalStorage();
    if (!stored || !stored.features) return;

    const updatedFeatures = stored.features.map((f) =>
      f.id === original.id
        ? {
            ...f,
            properties: {
              ...f.properties,
              height: height,
            },
          }
        : f
    );

    saveToLocalStorage({
      ...stored,
      features: updatedFeatures,
    });
  };

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);

    const draw = drawRef.current;
    if (!draw) return;

    const terraDraw = draw.getTerraDrawInstance();
    const selected = draw.getFeatures(true).features;

    if (!selected.length) return;

    const original = selected[0];

    const updatedFeature = {
      ...original,
      properties: {
        ...original.properties,
        color: newColor,
      },
    };

    // Xóa feature cũ
    terraDraw.removeFeatures([original.id]);

    // Thêm lại feature mới đã đổi màu
    terraDraw.addFeatures([updatedFeature]);

    const stored = loadFromLocalStorage();
    if (!stored || !stored.features) return;

    const updatedFeatures = stored.features.map((f) =>
      f.id === original.id
        ? {
            ...f,
            properties: {
              ...f.properties,
              color: newColor,
            },
          }
        : f
    );

    saveToLocalStorage({
      ...stored,
      features: updatedFeatures,
    });
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    const map = mapRef.current;
    const draw = drawRef.current;
    if (!file || !map) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageDataUrl = reader.result;

      ImageElement.add(map, imageDataUrl);
    };

    reader.readAsDataURL(file);
  };

  function moveLayerUp(map, layerId) {
    const layerOrder = map.getStyle().layers.map((l) => l.id);
    const index = layerOrder.indexOf(layerId);
    if (index <= 0) return;

    const aboveLayerId = layerOrder[index + 1];

    map.moveLayer(layerId, aboveLayerId);

    // Đổi chỗ trong mảng
    [layerOrder[index - 1], layerOrder[index]] = [
      layerOrder[index],
      layerOrder[index - 1],
    ];
  }

  const logdata = () => {
    // const draw = drawRef.current;
    // const geojson = draw.getFeatures();
    // // console.log("geojson", geojson);
    // console.log(mapRef.current.getStyle());
    // const map = mapRef.current;
    // moveLayerUp(mapRef.current, "layer-9c6f0cf2-3e56-4ceb-9257-53a902d82e67");
    // map.removeLayer("layer-9c6f0cf2-3e56-4ceb-9257-53a902d82e67");
    // map.moveLayer(layerId, aboveLayerId);

    // console.log("selectedElement", selectedElement);
  };

  return (
    <Form>
      <FormGroup>
        <Label htmlFor="height">Height:</Label>
        <Input
          type="number"
          id="height"
          placeholder="height..."
          value={height}
          onChange={(e) => {
            const value = e.target.value;
            setHeight(value); // 👈 cập nhật state để tránh cảnh báo

            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
              updateSelectedFeatureHeight(parsed); // 👈 cập nhật dữ liệu feature
            }
          }}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="color">Color:</Label>
        <ColorInput id="color" value={color} onChange={handleChangeColor} />
      </FormGroup>

      <FormGroup>
        <SubmitButton as="label" htmlFor="upload">
          📷 Upload Image
        </SubmitButton>
        <input
          id="upload"
          type="file"
          accept="image/*"
          onChange={handleUploadImage}
          style={{ display: "none" }}
        />
      </FormGroup>

      <button type="button" onClick={logdata}>
        {" "}
        Save
      </button>
    </Form>
  );
};

const Form = styled.form`
  max-width: 400px;
  margin: 2rem auto;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 1.2rem;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  width: 50px;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.6rem;
  font-size: 1rem;
  border: 1px solid #ccc;
  border-radius: 6px;
  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const ColorInput = styled.input.attrs({ type: "color" })`
  appearance: none;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  background: none;

  &::-webkit-color-swatch-wrapper {
    padding: 0;
    border-radius: 8px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: 8px;
  }

  &::-moz-color-swatch {
    border: none;
    border-radius: 8px;
  }
`;

const SubmitButton = styled.button`
  padding: 0.6rem 1.2rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }

  a {
    text-decoration: none;
    color: white;
  }
`;
