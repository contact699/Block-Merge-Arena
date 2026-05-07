module.exports = function (api) {
  const isTest = api.env('test');
  const isProduction = api.env('production');
  api.cache(true);
  if (isTest) {
    return { presets: ['@babel/preset-env', '@babel/preset-typescript'] };
  }
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind", unstable_transformImportMeta: true }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@": "./src",
            "@/shared": "./shared",
            "better-auth/react": "./node_modules/better-auth/dist/client/react/index.cjs",
            "better-auth/client/plugins":
              "./node_modules/better-auth/dist/client/plugins/index.cjs",
            "@better-auth/expo/client": "./node_modules/@better-auth/expo/dist/client.cjs",
          },
        },
      ],
      "@babel/plugin-proposal-export-namespace-from",
      "react-native-reanimated/plugin",
      // Production builds strip console.log/info/debug/trace; warn + error
      // are kept so on-device crash logs remain useful.
      ...(isProduction ? [["transform-remove-console", { exclude: ["error", "warn"] }]] : []),
    ],
  };
};
