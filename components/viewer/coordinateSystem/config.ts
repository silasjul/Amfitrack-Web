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
const sensorColors = {
  shadcn: { clean: "#34d399", distorted: "#f43f5e" },
  regular: { clean: "rgb(3, 252, 44)", distorted: "rgb(255, 0, 0)" },
};

export const SENSOR_COLOR_CLEAN = sensorColors.regular.clean;
export const SENSOR_COLOR_DISTORTED = sensorColors.regular.distorted;

export const SOURCE_COLOR = sensorColors.regular.clean;
