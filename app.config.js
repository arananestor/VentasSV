import 'dotenv/config';

export default {
  expo: {
    name: "VentasSV",
    slug: "VentasSV",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#000000",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ventasv.pos",
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#000000",
      },
      edgeToEdgeEnabled: false,
      package: "com.ventasv.pos",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      googleMapsKey: process.env.GOOGLE_MAPS_KEY,
      eas: {
        projectId: "bcd739cc-a26f-46b5-9df3-83805485021d",
      },
    },
  },
};