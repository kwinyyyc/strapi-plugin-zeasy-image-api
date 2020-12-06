'use strict';
const axios = require('axios');
const _ = require('lodash');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const pluginId = require('../admin/src/pluginId');
const constants = require('../utils/constants');
const { getAbsoluteServerUrl } = require('strapi-utils');

const generateAbsoluteUrl = (url = '') => {
  return url.startsWith('http') ? url : `${getAbsoluteServerUrl(strapi.config)}${url}`;
};

const createGiphyLogo = async () => {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'plugin',
    name: 'image-api',
  });

  const giphyLogo = await pluginStore.get({
    key: constants.config.giphyLogo,
  });
  const newString = giphyLogo.replace('data:image/png;base64,', '');
  const buf = Buffer.from(newString, 'base64');
  const uploadedLogo = await uploadImage({ fileName: constants.config.giphyLogo, buf, mime: 'image/png' });
  const logoUrl = uploadedLogo.url;
  await createImportedImage({ type: constants.config.giphyLogo, imageId: uploadedLogo.id });
  return logoUrl;
};

const createImportedImage = async ({
  type,
  imageId,
  originalId = null,
  originalName = null,
  originalUrl = null,
  authorName = null,
  authorUrl = null,
}) => {
  const data = {
    type,
    image: imageId,
    original_id: originalId,
    original_name: originalName,
    original_url: originalUrl,
    author_name: authorName,
    author_url: authorUrl,
  };
  await strapi.query(constants.model.importedImages, pluginId).create(data);
};

const getImportedImage = async ({ type }) => {
  const result = await strapi.query(constants.model.importedImages, pluginId).findOne({ type });
  return result;
};

const mapGiphyImagesToStandardImages = (images, pageNumber, pageCount) => {
  const { data, pagination } = images;
  const standardImages = data.map((image) => {
    const { type, id, user, title, images: imgs, url } = image;
    const authorName = user ? user.displayName : null;
    const authorUrl = user ? user.profile_url : null;
    const urls = {
      webUrl: url,
      original: imgs.original.url,
      thumb: imgs.downsized.url,
      small: imgs.downsized.url,
      regular: imgs.downsized_medium.url,
      large: imgs.downsized_large.url,
      default: imgs.downsized.url,
      download: imgs.downsized.url,
    };
    return {
      id,
      type,
      authorName,
      authorUrl,
      originalName: title,
      urls: urls,
    };
  });
  return {
    items: standardImages,
    pageNumber,
    pageCount,
    totalCount: pagination.total_count / pagination.count,
  };
};

const mapUnsplashImagesToStandardImages = (images, pageNumber, pageCount) => {
  const { results, total } = images;
  const standardImages = results.map((image) => {
    const { id, user, description, alt_description, urls: uris, links } = image;
    const authorName = user ? user.name : null;
    const authorUrl = user && user.links ? user.links.html : null;
    const urls = {
      webUrl: links.html,
      original: uris.raw,
      thumb: uris.thumb,
      small: uris.small,
      regular: uris.regular,
      large: uris.full,
      default: uris.regular,
      download: links.download,
    };
    return {
      id,
      type: 'image',
      authorName,
      authorUrl,
      originalName: description || alt_description,
      urls: urls,
    };
  });

  return {
    items: standardImages,
    pageNumber,
    pageCount,
    totalCount: total,
  };
};

const uploadImage = async ({ data, fileName, altText = null, caption = null, buf, mime }) => {
  const readBuffer = buf ? buf : Buffer.from(data);
  let mimeType = mime;
  if (!mime) {
    const fileType = await FileType.fromBuffer(readBuffer);
    mimeType = fileType.mime;
  }
  const { optimize } = strapi.plugins.upload.services['image-manipulation'];
  const { buffer, info } = await optimize(readBuffer);
  const metas = {};
  const fileInfo = { alternativeText: altText, caption };
  const formattedFile = strapi.plugins.upload.services.upload.formatFileInfo(
    {
      filename: fileName,
      type: mimeType,
      size: Buffer.byteLength(buffer),
    },
    fileInfo,
    metas,
  );
  const fileData = _.assign(formattedFile, info, {
    buffer,
  });
  const result = await strapi.plugins.upload.services.upload.uploadFileAndPersist(fileData);
  return result;
};

module.exports = {
  searchGiphyImages: async (ctx) => {
    const { pageNumber, query, pageCount } = ctx.request.body;
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions[constants.config.giphy]) {
      return;
    }
    const { accessKey } = providerOptions[constants.config.giphy];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const offset = (pageNumber - 1) * pageNumber;
    const result = await axios
      .get(constants.api.giphy.searchGifs, {
        params: {
          api_key: accessKey,
          offset: offset,
          q: query,
          limit: pageCount,
        },
      })
      .catch(({ message }) => {
        alert('Failed to get image ' + message);
      });
    const { data } = result;
    return mapGiphyImagesToStandardImages(data, pageNumber, pageCount);
  },
  searchUnsplashImages: async (ctx) => {
    const { pageNumber, query, pageCount } = ctx.request.body;
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions[constants.config.unsplash]) {
      return;
    }
    const { accessKey } = providerOptions[constants.config.unsplash];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const result = await axios
      .get(constants.api.unsplash.searchImages, {
        params: {
          page: pageNumber,
          query: query,
          pageCount: pageCount,
        },
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      })
      .catch(({ message }) => {
        alert('Failed to get image ' + message);
      });
    const { data } = result;
    return mapUnsplashImagesToStandardImages(data, pageNumber, pageCount);
  },
  importUnsplashImage: async (ctx) => {
    const { targetImage = {} } = ctx.request.body;
    const {
      id: originalId,
      webUrl,
      originalName,
      urls,
      authorName,
      authorUrl,
      fileName = uuidv4(),
      altText = null,
      caption = null,
    } = targetImage;
    const { default: defaultUrl } = urls;
    if (!originalId || !fileName) {
      // throw error
      return;
    }
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions[constants.config.unsplash]) {
      return;
    }
    const { accessKey, appName = '' } = providerOptions[constants.config.unsplash];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const response = await axios.get(`${constants.api.unsplash.downloadImage}/${originalId}/download`, {
      headers: {
        authorization: `Client-ID ${accessKey}`,
      },
    });
    const getImageUrl = response.data.url;
    const imageResponse = await axios.get(getImageUrl, {
      responseType: 'arraybuffer',
    });
    const result = await uploadImage({ data: imageResponse.data, fileName, altText, caption });
    await createImportedImage({
      type: constants.config.unsplash,
      imageId: result.id,
      originalId,
      originalName,
      originalUrl: defaultUrl,
      authorName,
      authorUrl,
    });
    const { url } = result;
    const imageAbsUrl = generateAbsoluteUrl(url);
    const attribution = `Photo by [${targetImage.authorName}](${targetImage.authorUrl}/?utm_source=${appName}&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=${appName}&utm_medium=referral)`;

    ctx.send({
      url: imageAbsUrl,
      appName,
      attribution,
      attributionType: constants.config.unsplash,
    });
  },
  importGiphyImage: async (ctx) => {
    const { targetImage = {} } = ctx.request.body;
    const {
      id: originalId,
      originalName,
      urls,
      authorName,
      authorUrl,
      fileName = uuidv4(),
      altText = null,
      caption = null,
    } = targetImage;
    const { default: defaultUrl, webUrl } = urls;
    if (!originalId || !fileName) {
      // throw error
      return;
    }
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions[constants.config.giphy]) {
      return;
    }
    const { accessKey, appName = '' } = providerOptions[constants.config.giphy];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const imageResponse = await axios.get(defaultUrl, {
      responseType: 'arraybuffer',
    });
    const result = await uploadImage({ data: imageResponse.data, fileName, altText, caption });
    await createImportedImage({
      type: constants.config.giphy,
      imageId: result.id,
      originalId,
      originalName,
      originalUrl: defaultUrl,
      authorName,
      authorUrl,
    });
    const { url } = result;
    const imageAbsUrl = generateAbsoluteUrl(url);

    const logo = await getImportedImage({ type: constants.config.giphyLogo });
    let logoUrl = logo && logo.image && logo.image.url ? logo.image.url : undefined;
    if (!logoUrl) {
      logoUrl = await createGiphyLogo();
    }
    const logoAbsUrl = generateAbsoluteUrl(logoUrl);

    const attribution = `[![](${logoAbsUrl})](${webUrl})`;

    ctx.send({
      url: imageAbsUrl,
      appName,
      attributionType: constants.config.giphy,
      attribution,
      attributionUrl: webUrl,
    });
  },
};
