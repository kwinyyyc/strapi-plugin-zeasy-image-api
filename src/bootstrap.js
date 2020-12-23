const giphyLogo = require('../images/GIPHY_Logo.png');
const constants = require('../utils/constants');

const initFn = async () => {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'image-api',
  });

  await pluginStore.set({
    key: constants.config.giphyLogo,
    value: giphyLogo.default,
  });
};

module.exports = initFn;
