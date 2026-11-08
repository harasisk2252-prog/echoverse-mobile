export const C = {
  bg: "#090719",
  surface: "#19132f",
  surface2: "#251a41",
  line: "#56416f",
  white: "#faf4ff",
  muted: "#bcb0d2",
  lavender: "#d4aaff",
  pink: "#ffacd8",
  blue: "#9edfff",
  gold: "#ffda94",
  mint: "#a7eecf",
};
export const moods = {
  joy: { label: "Joy", color: C.gold, icon: "✦" },
  love: { label: "Love", color: C.pink, icon: "♡" },
  peace: { label: "Peace", color: C.blue, icon: "☾" },
  pride: { label: "Pride", color: C.lavender, icon: "✧" },
  nostalgia: { label: "Nostalgia", color: C.mint, icon: "❋" },
} as const;
export type Mood = keyof typeof moods;
