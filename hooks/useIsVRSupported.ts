import { useEffect, useState } from "react";

export function useIsVRSupported(): boolean {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    let cancelled = false;
    navigator.xr
      ?.isSessionSupported("immersive-vr")
      .then((ok) => {
        if (!cancelled) setSupported(ok);
      })
      .catch(() => {
        if (!cancelled) setSupported(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return supported;
}
