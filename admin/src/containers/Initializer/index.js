/**
 *
 * Initializer
 *
 */

import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import pluginId from '../../pluginId';
import { useStrapi } from 'strapi-helper-plugin';
import { withImageApiPanel } from '../../components/ImageApi/index';

const Initializer = ({ updatePlugin }) => {
  const {
    strapi: { fieldApi },
  } = useStrapi();
  const ref = useRef();
  ref.current = updatePlugin;

  useEffect(() => {
    const Wysiwyg = fieldApi.getField('wysiwyg');
    if (Wysiwyg && Wysiwyg.Component && typeof Wysiwyg.Component === 'function') {
      fieldApi.removeField('wysiwyg');
      fieldApi.registerField({ type: 'wysiwyg', Component: withImageApiPanel(Wysiwyg.Component) });
    }
    ref.current(pluginId, 'isReady', true);
  }, []);

  return null;
};

Initializer.propTypes = {
  updatePlugin: PropTypes.func.isRequired,
};

export default Initializer;
