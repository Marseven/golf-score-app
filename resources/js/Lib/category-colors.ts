export type PlayerCategory = "Pro H" | "Pro F" | "Amateur H" | "Amateur F";

export const categoryColors: Record<string, string> = {
  "Pro H": "bg-blue-800 text-blue-100",
  "Pro F": "bg-pink-700 text-pink-100",
  "Amateur H": "bg-emerald-700 text-emerald-100",
  "Amateur F": "bg-violet-600 text-violet-100",
};

export const categoryDotColors: Record<string, string> = {
  "Pro H": "bg-blue-500",
  "Pro F": "bg-pink-500",
  "Amateur H": "bg-emerald-500",
  "Amateur F": "bg-violet-500",
};
