const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Exclude react-native-maps from web bundle (native-only module)
config.resolver = config.resolver ?? {};
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && moduleName === "react-native-maps") {
    return { filePath: require.resolve("./lib/empty-module.js"), type: "sourceFile" };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Force write CSS to file system instead of virtual modules
  // This fixes iOS styling issues in development mode
  forceWriteFileSystem: true,
});
