'use strict';
const axios = require('axios');
const _ = require('lodash');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const pluginId = require('../admin/src/pluginId');
const constants = require('../utils/constants');
const { getAbsoluteServerUrl } = require('strapi-utils');

const catchUnauthorizedResponse = ({ ctx, platform }) => (error) => {
  if (error.response && error.response.status === 403) {
    ctx.throw(403, `Authorization error calling ${platform}, please verify the credentials.`);
  }
  ctx.throw(500, 'Internal server error');
};

const catchImageDownloadResponse = ({ ctx, platform }) => (error) => {
  ctx.throw(500, `Failed to download image from ${platform} due to ${error.message}`);
};

const getProviderConfigByPlatform = ({ platform }) => {
  let isValid = true;
  let message = '';
  const { providerOptions } = strapi.plugins[pluginId].config;
  if (providerOptions === 'undefined' || !providerOptions || !providerOptions[platform]) {
    isValid = false;
    message = `${platform} config not found, please check the readme and provide a valid ${platform} config.`;
    return { isValid, message };
  }
  const { accessKey, appName = '' } = providerOptions[platform];
  if (accessKey === 'undefined' || !accessKey) {
    isValid = false;
    message = `${platform} Access Key must be provided.`;
    return { isValid, message };
  }
  const { isHtmlEditor = false } = providerOptions;
  return { isValid, message, accessKey, isHtmlEditor, appName };
};

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
  webUrl = null,
}) => {
  const data = {
    type,
    image: imageId,
    original_id: originalId,
    original_name: originalName,
    original_url: originalUrl,
    author_name: authorName,
    author_url: authorUrl,
    web_url: webUrl,
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
    const platform = constants.config.giphy;
    const { isValid, message, accessKey, isHtmlEditor, appName } = getProviderConfigByPlatform({ platform });
    if (!isValid) {
      ctx.response.status = 500;
      ctx.response.message = message;
      return ctx;
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
      .catch(catchUnauthorizedResponse({ ctx, platform }));
    const { data } = result;
    return mapGiphyImagesToStandardImages(data, pageNumber, pageCount);
  },
  searchUnsplashImages: async (ctx) => {
    const { pageNumber, query, pageCount } = ctx.request.body;
    const platform = constants.config.unsplash;
    const { isValid, message, accessKey, isHtmlEditor, appName } = getProviderConfigByPlatform({ platform });
    if (!isValid) {
      ctx.response.status = 500;
      ctx.response.message = message;
      return ctx;
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
      .catch(catchUnauthorizedResponse({ ctx, platform }));
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
      ctx.response.status = 500;
      ctx.response.message = 'Invalid file name.';
      return ctx;
    }
    const platform = constants.config.unsplash;
    const { isValid, message, accessKey, isHtmlEditor, appName = '' } = getProviderConfigByPlatform({ platform });
    if (!isValid) {
      ctx.response.status = 500;
      ctx.response.message = message;
      return ctx;
    }
    const response = await axios
      .get(`${constants.api.unsplash.downloadImage}/${originalId}/download`, {
        headers: {
          authorization: `Client-ID ${accessKey}`,
        },
      })
      .catch(catchUnauthorizedResponse({ ctx, platform }));
    const getImageUrl = response.data.url;
    const imageResponse = await axios
      .get(getImageUrl, {
        responseType: 'arraybuffer',
      })
      .catch(catchImageDownloadResponse({ ctx, platform }));
    const result = await uploadImage({ data: imageResponse.data, fileName, altText, caption });
    await createImportedImage({
      type: platform,
      imageId: result.id,
      originalId,
      originalName,
      originalUrl: defaultUrl,
      authorName,
      authorUrl,
      webUrl,
    });
    const { url } = result;
    const imageAbsUrl = generateAbsoluteUrl(url);
    let imageContent = '';
    const gtmPrepend = `?utm_source=${appName}&utm_medium=referral`;
    if (isHtmlEditor) {
      imageContent = `
        <div class="${pluginId}-image-container">
          <img src="${imageAbsUrl}" />
          <p>Photo by <a href="${targetImage.authorUrl}/${gtmPrepend}" target="_blank">${targetImage.authorName}</a> on <a href="https://unsplash.com/${gtmPrepend}">Unsplash</a></p>
        </div>
        `;
    } else {
      imageContent = `![](${imageAbsUrl})
Photo by [${targetImage.authorName}](${targetImage.authorUrl}/${gtmPrepend}) on [Unsplash](https://unsplash.com/${gtmPrepend})`;
    }

    ctx.send({
      imageContent,
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
      ctx.response.status = 500;
      ctx.response.message = 'Invalid file name.';
      return ctx;
    }
    const platform = constants.config.giphy;
    const { isValid, message, accessKey, isHtmlEditor, appName } = getProviderConfigByPlatform({ platform });
    if (!isValid) {
      ctx.response.status = 500;
      ctx.response.message = message;
      return ctx;
    }
    const imageResponse = await axios
      .get(defaultUrl, {
        responseType: 'arraybuffer',
      })
      .catch(catchImageDownloadResponse({ ctx, platform }));
    const result = await uploadImage({ data: imageResponse.data, fileName, altText, caption });
    await createImportedImage({
      type: platform,
      imageId: result.id,
      originalId,
      originalName,
      originalUrl: defaultUrl,
      authorName,
      authorUrl,
      webUrl,
    });
    const { url } = result;
    const imageAbsUrl = generateAbsoluteUrl(url);

    const logo = await getImportedImage({ type: constants.config.giphyLogo });
    let logoUrl = logo && logo.image && logo.image.url ? logo.image.url : undefined;
    if (!logoUrl) {
      logoUrl = await createGiphyLogo();
    }
    const logoAbsUrl = generateAbsoluteUrl(logoUrl);

    let imageContent = '';
    if (isHtmlEditor) {
      imageContent = `
        <div class="${pluginId}-image-container">
          <img src="${imageAbsUrl}" />
          <a href="${webUrl}"><img src="${logoAbsUrl}" /></a>
        </div>
        `;
    } else {
      imageContent = `![](${imageAbsUrl})
[![](${logoAbsUrl})](${webUrl})`;
    }

    ctx.send({
      imageContent,
    });
  },
};
