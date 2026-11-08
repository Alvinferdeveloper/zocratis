export type ViewMode = "grid" | "list";

export type SortBy = "name" | "date";

// Container for the items in each view; the skeletons render inside the same one.
export const ITEMS_LAYOUT: Record<ViewMode, string> = {
  grid: "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  list: "flex flex-col gap-0.5",
};
