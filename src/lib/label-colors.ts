// Fixed palette rather than a free color picker — keeps labels visually
// consistent with the rest of the app's CIIT-palette-driven design instead
// of introducing arbitrary colors (see branding notes: only the primary
// palette is used in the ticketing UI, not the client's secondary one).
export const LABEL_COLOR_OPTIONS = [
  { value: "#00364D", label: "Dark Blue" },
  { value: "#47C7F4", label: "Sky Blue" },
  { value: "#005671", label: "Blue" },
  { value: "#73CBE9", label: "Light Blue" },
  { value: "#B3E3F3", label: "Seafoam" },
  { value: "#444444", label: "Dark Grey" },
  { value: "#AAAAAA", label: "Grey" },
] as const;

export const DEFAULT_LABEL_COLOR = LABEL_COLOR_OPTIONS[0].value;
