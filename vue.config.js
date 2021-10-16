module.exports = {
  transpileDependencies: ["vuetify"],
  pwa: {
    workboxOptions: {
      skipWaiting: true,
    },
  },
  devServer: {
    https: true, // so we can use crypto.subtle
  },
};
