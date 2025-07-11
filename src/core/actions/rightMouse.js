export function showContextMenu(screenPoint, onUp, onDown) {
  const existing = document.getElementById("map-context-menu");
  if (existing) existing.remove();

  const menu = document.createElement("div");
  menu.id = "map-context-menu";
  Object.assign(menu.style, {
    position: "absolute",
    top: `${screenPoint.y}px`,
    left: `${screenPoint.x}px`,
    zIndex: 9999,
    background: "white",
    border: "1px solid #ccc",
    padding: "4px 0",
    boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
    borderRadius: "4px",
    minWidth: "100px",
    fontSize: "13px",
  });

  const options = [
    { label: "⬆️ Lên trên", action: onUp },
    { label: "⬇️ Xuống dưới", action: onDown },
  ];

  for (const opt of options) {
    const item = document.createElement("div");
    item.textContent = opt.label;
    item.style.cssText = "cursor:pointer;padding:6px 12px;";
    item.onmouseenter = () => (item.style.background = "#f0f0f0");
    item.onmouseleave = () => (item.style.background = "white");
    item.onclick = () => {
      opt.action?.();
      menu.remove();
    };
    menu.appendChild(item);
  }

  document.body.appendChild(menu);
}
