import { useState } from "react";
import { useKeyPress } from "./useKeyPress";

export function useLevaToggle(initialHidden = true) {
  const [hidden, setHidden] = useState(initialHidden);

  useKeyPress("h", () => setHidden((h) => !h));

  return hidden;
}
