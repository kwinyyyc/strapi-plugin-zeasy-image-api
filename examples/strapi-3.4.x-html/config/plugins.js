module.exports = ({ env }) => {
  return {
    'zeasy-image-api': {
      providerOptions: {
        isHtmlEditor: true,
        unsplash: {
          appName: env('UNSPLASH_APP_NAME'),
          accessKey: env('UNSPLASH_ACCESS_KEY'),
        },
        giphy: {
          accessKey: env('GIPHY_ACCESS_KEY'),
        },
      },
    },
  };
};
