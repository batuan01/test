import React, { createContext, useState } from "react";

// Tạo Context
const MapContext = createContext();

// Tạo Provider
const MapProvider = ({ children }) => {
  const [selectedElement, setSelectedElement] = useState(null);

  const contextValue = {
    selectedElement,
    setSelectedElement,
  };

  return (
    <MapContext.Provider value={contextValue}>{children}</MapContext.Provider>
  );
};

export { MapContext, MapProvider };
