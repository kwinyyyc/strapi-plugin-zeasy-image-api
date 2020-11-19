const giphyIcon = require('../../images/GIPHY_Icon.png');

const initFn = async () => {
  console.log('this is the image-api plugin bootstrap.js');
  console.log('this is the giphy icon', giphyIcon.default);
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'image-api',
  });

  await pluginStore.set({
    key: 'giphyIcon',
    value: giphyIcon.default,
  });

  const config = await pluginStore.get({
    key: 'giphyIcon',
  });
  console.log('config', config);
};

module.exports = initFn;
