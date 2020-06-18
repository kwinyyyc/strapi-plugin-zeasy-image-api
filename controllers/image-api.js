'use strict';
const axios = require('axios');
const _ = require('lodash');
const FileType = require('file-type');
const { v4: uuidv4 } = require('uuid');
const pluginId = require('../admin/src/pluginId');

/**
 * image-api.js controller
 *
 * @description: A set of functions called "actions" of the `image-api` plugin.
 */

module.exports = {
  /**
   * Default action.
   *
   * @return {Object}
   */
  searchUnsplashImages: async (ctx) => {
    const { pageNumber, query, pageCount } = ctx.request.body;
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions['unsplash']) {
      return;
    }
    const { accessKey } = providerOptions['unsplash'];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const result = await axios
      .get(`https://api.unsplash.com/search/photos?page=${pageNumber}&query=${query}&pageCount=${pageCount}`, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
        },
      })
      .catch(({ message }) => {
        alert('failed to get image ' + message);
      });
    const { data } = result;
    return data;
  },
  importUnsplashImage: async (ctx) => {
    const { id, fileName = uuidv4(), altText = null, caption = null } = ctx.request.body;
    if (!id || !fileName) {
      // throw error
      return;
    }
    const { providerOptions } = strapi.plugins[pluginId].config;
    if (!providerOptions || !providerOptions['unsplash']) {
      return;
    }
    const { accessKey, appName = '' } = providerOptions['unsplash'];
    if (!accessKey) {
      throw new Error('Access Key must be provided');
    }
    const response = await axios.get(`https://api.unsplash.com/photos/${id}/download`, {
      headers: {
        authorization: `Client-ID ${accessKey}`,
      },
    });
    const getImageUrl = response.data.url;
    const imageResponse = await axios.get(getImageUrl, {
      responseType: 'arraybuffer',
    });
    const readBuffer = Buffer.from(imageResponse.data);
    const { mime } = await FileType.fromBuffer(readBuffer);
    const { optimize } = strapi.plugins.upload.services['image-manipulation'];
    const { buffer, info } = await optimize(readBuffer);
    const metas = {};
    const fileInfo = { alternativeText: altText, caption };
    const formattedFile = strapi.plugins.upload.services.upload.formatFileInfo(
      {
        filename: fileName,
        type: mime,
      },
      fileInfo,
      metas,
    );

    const fileData = _.assign(formattedFile, info, {
      buffer,
    });
    const result = await strapi.plugins.upload.services.upload.uploadFileAndPersist(fileData);
    const { url } = result;
    ctx.send({
      url,
      appName,
    });
  },
};
