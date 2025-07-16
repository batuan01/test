export const isPathElement = (element) => {
  return (
    element != null && element?.properties?.type?.toLowerCase?.() === "path"
  );
};
