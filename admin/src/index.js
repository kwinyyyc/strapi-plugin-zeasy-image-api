import pluginPkg from '../../package.json';
import pluginId from './pluginId';
import Initializer from './containers/Initializer';
import lifecycles from './lifecycles';
import trads from './translations';
import { ImageApiPanel } from './components/ImageApi/index';

export default (strapi) => {
  const pluginDescription = pluginPkg.strapi.description || pluginPkg.description;

  const plugin = {
    blockerComponent: null,
    blockerComponentProps: {},
    description: pluginDescription,
    icon: pluginPkg.strapi.icon,
    id: pluginId,
    initializer: Initializer,
    injectedComponents: [],
    isReady: false,
    isRequired: pluginPkg.strapi.required || false,
    layout: null,
    lifecycles,
    leftMenuLinks: [],
    leftMenuSections: [],
    name: pluginPkg.strapi.name,
    preventComponentRendering: false,
    trads,
  };

  strapi.registerComponent({ name: 'image-api-panel', Component: ImageApiPanel });

  return strapi.registerPlugin(plugin);
};
