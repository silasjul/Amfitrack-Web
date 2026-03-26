# First R3F App

A React Three Fiber (R3F) learning project built with Next.js. Renders an interactive 3D scene featuring the glTF Flight Helmet model with HDR environment maps, configurable lighting, and real-time debug controls.

## What I Learned

### React Three Fiber (`@react-three/fiber`)
R3F lets you write Three.js scenes declaratively as React components. The `<Canvas>` component sets up the WebGL renderer and scene, and everything inside it maps directly to Three.js objects — but as JSX. Coming from a React background, this finally makes Three.js feel natural: state, hooks, and components all work exactly as expected.

### Drei (`@react-three/drei`)
A helper library that abstracts common Three.js patterns into ready-to-use R3F components and hooks:

- **`<OrbitControls>`** — adds mouse/touch camera orbit, pan, and zoom to the scene
- **`<PivotControls>`** — renders an interactive gizmo (arrows, arcs, planes) on any object so you can translate and rotate it directly in the viewport
- **`<Environment>`** — loads an HDR equirectangular image as both the scene background and IBL lighting source
- **`useGLTF`** — hook that loads and caches a `.gltf`/`.glb` model; returns the scene graph, animations, and materials
- **`useHelper`** — hook that conditionally attaches a Three.js helper (e.g. `DirectionalLightHelper`) to a ref for debugging

### Leva
A floating debug panel for React. `useControls` returns live-bound values and re-renders the component whenever a control changes — no boilerplate needed. Supports sliders, color pickers, dropdowns, and `folder()` for grouping controls.

## Scene Overview

| Feature | Details |
|---|---|
| Model | glTF Flight Helmet with cast/receive shadows |
| Environment | 7 Star Wars HDR maps (switchable via Leva) |
| Lighting | Directional light with configurable color, intensity, position, shadow map resolution, and an optional helper |
| Tone Mapping | Switchable between None, Linear, Reinhard, Cineon, ACESFilmic |
| Controls | OrbitControls for camera; PivotControls (toggleable) for moving the helmet |

## Project Structure

```
app/
  page.tsx          # Canvas setup, Leva controls, scene composition
components/
  FlightHelmet.tsx  # Loads the glTF model, enables shadows on all meshes
  Light.tsx         # Directional light with full Leva debug controls
public/
  environmentMaps/  # 7 Star Wars HDR environment maps
  models/           # FlightHelmet glTF model + textures
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Stack

- [Next.js](https://nextjs.org) 16
- [React](https://react.dev) 19
- [Three.js](https://threejs.org) 0.183
- [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber) 9
- [@react-three/drei](https://github.com/pmndrs/drei) 10
- [Leva](https://github.com/pmndrs/leva) 0.10
- [Tailwind CSS](https://tailwindcss.com) 4
- TypeScript
