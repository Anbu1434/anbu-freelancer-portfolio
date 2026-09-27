/** 4 columns on mobile, 8 on tablet, 12 on desktop. */
export const gridClass = "grid grid-cols-4 gap-x-4 sm:grid-cols-8 sm:gap-x-5 lg:grid-cols-12 lg:gap-x-6";

/**
 * The reference's two-column block (wide card + side list). From 1280px both columns share
 * a subgrid, so titles of different heights still leave the cards top-aligned.
 */
export const splitClass =
  "grid gap-12 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] xl:grid-rows-[auto_1fr] xl:gap-x-10 xl:gap-y-8";
export const splitColumnClass = "flex flex-col gap-6 lg:gap-8 xl:row-span-2 xl:grid xl:grid-rows-subgrid";
