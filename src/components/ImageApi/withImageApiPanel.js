/* eslint-disable react/display-name */
import React from 'react';
import ImageApiPanel from './ImageApiPanel';

export const withImageApiPanel = (Component) => ({ ...props }) => {
  const { value, name, onChange } = props;
  return (
    <>
      <ImageApiPanel editor={{ value, name }} onEditorChange={onChange} />
      <Component {...props} />
    </>
  );
};
