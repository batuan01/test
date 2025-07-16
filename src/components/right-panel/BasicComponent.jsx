import { useContext, useEffect, useState } from "react";
import styled from "styled-components";
import { MapContext } from "../../contexts/mapContext";
import { ImageElement } from "../../core/actions/image";
import { LayerOrdering } from "../../core/actions/layerOrdering";
import { Selection } from "../../core/actions/selection";
import { AppGlobals } from "../../core/globals";
import { updateFeatureInLocalStorage } from "../../core/utils";

export const BasicComponent = ({ drawRef, mapRef }) => {
  const [color, setColor] = useState("#787878");
  const [height, setHeight] = useState("");
  const [label, setLabel] = useState("");
  const [layer, setLayer] = useState("");

  const { selectedElement, setSelectedElement } = useContext(MapContext);
  const storedData = AppGlobals.getElements();

  const updateFeatureProperty = (property, value, mapRef) => {
    const element = storedData?.find((el) => el.id === selectedElement.id);
    if (!element) return;

    const map = mapRef.current;
    const updated = {
      ...element,
      properties: {
        ...element.properties,
        [property]: value,
      },
    };

    const sourceId = LayerOrdering.findFeatureSourceId(map, element);

    // Update map source using Selection class
    Selection.setSelectedData(map, updated, sourceId);

    AppGlobals.setDataToStore(updated);

    // Update local storage
    updateFeatureInLocalStorage(updated);
  };

  const updateSelectedFeatureHeight = (height, mapRef) => {
    updateFeatureProperty("height", height, mapRef);
  };

  const handleChangeColor = (e) => {
    const newColor = e.target.value;
    setColor(newColor);
    updateFeatureProperty("color", newColor || "#787878", mapRef);
  };

  const updateSelectedFeatureLabel = (label, mapRef) => {
    updateFeatureProperty("label", label, mapRef);
  };

  const handleChangeLayer = (e) => {
    const newLayer = e.target.value;
    setLayer(newLayer);
    updateFeatureProperty("layer", newLayer, mapRef);
  };

  useEffect(() => {
    const element = storedData?.find((el) => el.id === selectedElement?.id);
    if (!element) {
      setColor("#787878");
      setHeight("");
      setLabel("");
      setLayer("");
      return;
    }
    setColor(element.properties?.color);
    setHeight(element.properties?.height);
    setLabel(element.properties?.label);
    setLayer(element.properties?.layer);
  }, [selectedElement]);

  const logdata = () => {
    // const draw = drawRef.current;
    // const geojson = draw.getFeatures();
    // // console.log("geojson", geojson);
    console.log(mapRef.current.getStyle());
    // const map = mapRef.current;
    // moveLayerUp(mapRef.current, "layer-9c6f0cf2-3e56-4ceb-9257-53a902d82e67");
    // map.removeLayer("layer-9c6f0cf2-3e56-4ceb-9257-53a902d82e67");
    // map.moveLayer(layerId, aboveLayerId);
    // console.log("selectedElement", selectedElement);

    // console.log(loadFromLocalStorage());

    console.log("AppGlobals.getElements()", AppGlobals.getElements());
  };

  return (
    <Form>
      <SubmitButton
        type="button"
        onClick={logdata}
        style={{ marginBottom: "10px" }}
      >
        LogData
      </SubmitButton>

      <FormGroup>
        <Label htmlFor="label">Label:</Label>
        <Input
          type="string"
          id="label"
          placeholder="label..."
          value={label}
          onChange={(e) => {
            const value = e.target.value;
            setLabel(value); // 👈 cập nhật state để tránh cảnh báo
            updateSelectedFeatureLabel(value, mapRef); // 👈 cập nhật dữ liệu feature
          }}
        />
      </FormGroup>

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
              updateSelectedFeatureHeight(parsed, mapRef); // 👈 cập nhật dữ liệu feature
            }
          }}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="color">Layer:</Label>
        <StyledSelect value={layer} onChange={handleChangeLayer}>
          <option value="">-- Chọn một tùy chọn --</option>
          <option value="overview">Overview</option>
          <option value="booth">Booth</option>
        </StyledSelect>
      </FormGroup>

      <FormGroup>
        <Label htmlFor="color">Color:</Label>
        <ColorInput id="color" value={color} onChange={handleChangeColor} />
      </FormGroup>
    </Form>
  );
};

const Form = styled.form`
  max-width: 400px;
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
  width: calc(100% - 80px);
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

const StyledSelect = styled.select`
  padding: 10px;
  font-size: 16px;
  border: 2px solid #3498db;
  border-radius: 5px;
  background-color: white;
  color: #333;

  width: calc(100% - 60px);
  /* Hiệu ứng hover */
  &:hover {
    border-color: #2980b9;
  }

  /* Hiệu ứng focus */
  &:focus {
    outline: none;
    border-color: #2980b9;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
  }
`;
