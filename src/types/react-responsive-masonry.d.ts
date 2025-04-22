// types/react-responsive-masonry.d.ts
declare module 'react-responsive-masonry' {
  import * as React from 'react';

  export interface ResponsiveMasonryProps {
    children: React.ReactNode;
    columnsCountBreakPoints?: { [key: number]: number };
    gutter?: string | number;
  }

  export interface MasonryProps {
    children: React.ReactNode;
    columnsCount?: number;
    gutter?: string | number;
  }

  export const Masonry: React.FC<MasonryProps>;
  const ResponsiveMasonry: React.FC<ResponsiveMasonryProps>;

  export default ResponsiveMasonry;
}
