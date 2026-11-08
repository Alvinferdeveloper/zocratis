// Hidden until the item is hovered or focused, only where hovering exists (always visible on touch).
export const REVEAL_ON_HOVER =
  "can-hover:opacity-0 can-hover:group-hover:opacity-100 can-hover:group-focus-within:opacity-100 focus-visible:opacity-100";

// Shared by the list rows and their column header so the columns line up.
export const ROW_GRID =
  "grid grid-cols-[1rem_minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[1rem_minmax(0,1fr)_8rem_7rem_6rem]";
