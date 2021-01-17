# Strapi plugin image-api

This is a plugin for [strapi](https://github.com/strapi/strapi) headless CMS
It helps you to search for images on Unsplash and Giphy, import it to your media library and insert to your `Rich Text` content with appropriate attribution.

## Screenshots

## Import from Unsplash
![](screenshot_01.gif)

## Import from Giphy
![](screenshot_02.gif)

## Get Started
### Option 1, with React based wysiwyg strapi plugin installed
- e.g [strapi-plugin-wysiwsg-react-md-editor](https://github.com/kwinyyyc/strapi-plugin-wysiwsg-react-md-editor)
  

1. Install the package

With yarn:

`yarn add strapi-plugin-zeasy-image-api`

With npm:

`npm install strapi-plugin-zeasy-image-api`

2. Config Unsplash
   1. Register an Unsplash account [here](https://unsplash.com/developers)
   2. Create an app on Unsplash, take a note on your `app name` and your `Access Key`, it will be used later. <i>Note: there would be a limit of 50 requests per hour for a demo app</i>

3. Config Giphy
   1. Register a Giphy account [here](https://developers.giphy.com/)
   2. Create an API app on Giphy, take a note on your `API Key`, it will be used later. <i>Note: there would be a rate limited to a maximum of 42 search requests an hour and 1000 search requests a day for a beta key.</i>


4. Generate a config file at the path `/extensions/image-api/config/config.json` with below content

   ```json
   {
     "providerOptions": {
       "unsplash": {
         "appName": "YOUR_UNSPLASH_APP_NAME",
         "accessKey": "YOUR_UNSPLASH_ACCESS_KEY"
       },
        "giphy": {
          "accessKey": "YOUR_GIPHY_API_KEY"
        }
     }
   }
   ```
Or with strapi 3.xxx add in config/plugins.js

```
module.exports = ({ env }) => {
  return {
    'zeasy-image-api': {
      providerOptions: {
        unsplash: {
          appName: env('UNSPLASH_APP_NAME'),
          accessKey: env('UNSPLASH_ACCESS_KEY'),
        },
        giphy: {
          accessKey: env('GIPHY_API_KEY'),
        },
      },
    },
  };
};```
Then make sure you have below variables in your .env file
UNSPLASH_APP_NAME=XXXXXXX
UNSPLASH_ACCESS_KEY=XXXXXX
GIPHY_API_KEY=XXXXXX




### Option 2, without React based wysiwyg strapi plugin installed

1. Follow the same steps in option 1

2. Create a file under this path `/extensions/content-manager/admin/src/components/WysiwygWithErrors/index.js` with [the content here](./example/extensions/content-manager/admin/src/components/WysiwygWithErrors/index.js)

The code will get the image api panel component 
```js
const {
    strapi: {
      componentApi: { getComponent },
    },
  } = useStrapi();
  const ImageApiPanel = getComponent('image-api-panel').Component;
```

Then you can render it to any place you want.
```js
<ImageApiPanel editor={{ value, name }} onEditorChange={onChange} />
```
