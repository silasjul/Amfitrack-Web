// Coordinate System colors
const theme = {
  ghosted: {
    x: "#8c7373",
    y: "#738c7a",
    z: "#737c8c",
  },
  neon: {
    x: "#ff0055",
    y: "#00ffaa",
    z: "#0055ff",
  },
  shadcn: {
    x: "#10b981",
    y: "#2563eb",
    z: "#e11d48",
  },
};

const selectedTheme = theme.shadcn;

export const PRIMARY = "#e4e4e7";
export const AXIS_X = selectedTheme.x;
export const AXIS_Y = selectedTheme.y;
export const AXIS_Z = selectedTheme.z;
export const AXIS_LENGTH = 2.25;
export const TEXT_DISTANCE = 0.25;
export const GIZMO_LABEL_COLOR = "#000000";

// Sensor colors
// We moved from Emerald 500 -> Emerald 400
export const COLOR_CLEAN = "#34d399";

// We moved from Rose 600 -> Rose 500
export const COLOR_DISTORTED = "#f43f5e";
