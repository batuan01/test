export const isPathElement = (element) => {
  return (
    element != null && element?.properties?.type?.toLowerCase?.() === "path"
  );
};

export const isImageElement = (element) => {
  return (
    element != null && element?.properties?.type?.toLowerCase?.() === "image"
  );
};

export const isPolygonElement = (element) => {
  return (
    element != null && element?.properties?.type?.toLowerCase?.() === "polygon"
  );
};

export const isLineElement = (element) => {
  return (
    element != null &&
    element?.properties?.type?.toLowerCase?.() === "linestring"
  );
};
