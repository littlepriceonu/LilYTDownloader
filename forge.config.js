module.exports = {
  packagerConfig: {
    asar: {
      unpack: "**/*.exe"
    },
    executableName: "LilYTDownloader",
    icon: "./imgs/icon",
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        iconUrl: "https://raw.githubusercontent.com/littlepriceonu/LilYTDownloader/main/imgs/icon.ico",
        setupIcon: "./imgs/icon.ico",
        title: "LilYTDownloader",
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
