import React from 'react';

export const DrawerContext = React.createContext<{
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}>({
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
});
