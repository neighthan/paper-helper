module.exports = {
  transpileDependencies: ["vuetify"],
  pwa: {
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "public/service-worker.js",
    },
  },
  devServer: {
    https: true, // so we can use crypto.subtle
  },
};
