export const PALETTE = ["#7FE817","#8B5CF6","#F59E0B","#EC4899","#22D3EE","#F87171"];

export const normalizeHex = (c) => (c || "").toUpperCase();
export const sameColor = (a, b) => normalizeHex(a) === normalizeHex(b);

export const hexToRgb = (hex) => {
  const h = (hex || "#000000").replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16) || 0,
    g: parseInt(h.slice(2, 4), 16) || 0,
    b: parseInt(h.slice(4, 6), 16) || 0,
  };
};

export const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("").toUpperCase();
