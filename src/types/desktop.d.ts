export interface DesktopAPI {
  isDesktop: boolean;
  platform: string;
  minimize: () => Promise<void>;
  maximize: () => Promise<boolean>;
  close: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
  openExternal: (url: string) => Promise<boolean>;
  openPath: (fullPath: string) => Promise<string>;
  showItemInFolder: (fullPath: string) => Promise<boolean>;
  getVersion: () => Promise<string>;
  getAppInfo: () => Promise<{
    name: string;
    version: string;
    isPackaged: boolean;
    platform: string;
  }>;
  onWindowStateChange: (callback: (state: { isMaximized: boolean }) => void) => () => void;
}

declare global {
  interface Window {
    desktopAPI?: DesktopAPI;
  }
}
