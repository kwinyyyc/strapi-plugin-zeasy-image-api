module.exports = {
  config: {
    unsplash: 'unsplash',
    giphy: 'giphy',
  },
  model: {
    importedImages: 'imported-image',
  },
  api: {
    unsplash: {
      searchImages: 'https://api.unsplash.com/search/photos',
      downloadImage: 'https://api.unsplash.com/photos',
    },
    giphy: {
      searchGifs: 'https://api.giphy.com/v1/gifs/search',
    },
  },
  routes: {
    searchUnsplashImages: 'search-unsplash-images',
    importUnsplashImage: 'import-unsplash-image',
  },
};
