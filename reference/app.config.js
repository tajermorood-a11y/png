// Phantom has its OWN identity: it installs next to Tawaqoati and never replaces it.
// 1) change "yourname" in the package / bundle id
// 2) run `eas init` in this folder to create Phantom's own EAS project
module.exports = {
  expo: {
    name: 'فانتوم',
    slug: 'phantom',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    scheme: 'phantom',
    plugins: ['expo-router'],
    android: { package: 'com.yourname.phantom' },
    ios: { bundleIdentifier: 'com.yourname.phantom', supportsTablet: false },
  },
};
