import React, { useState } from 'react';
import styled from 'styled-components';
import { request } from 'strapi-helper-plugin';
import ImageApiTab from './ImageApiTab';
import PropTypes from 'prop-types';
import constants from '../../../utils/constants';
import pluginId from '../../../admin/src/pluginId';
import giphyLogo from '../../../images/GIPHY_Icon.png';
import unsplashLogo from '../../../images/Unsplash_Logo.png';

const ImageApiSearchContainer = styled.div`
  border-radius: 0.2rem;
  background-color: #ffffff;
  box-shadow: 0 0.2rem 0.4rem 0 #e3e9f3;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

const StyledTab = styled(ImageApiTab)`
  display: ${(props) => (props.active ? 'flex' : 'none')};
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
`;

const HeaderTab = styled.div`
  background-color: ${(props) => (props.active ? '#ffffff' : 'rgb(239, 239, 239)')};
  font-weight: ${(props) => (props.active ? 'bold' : 'normal')};
  text-decoration: none;
  box-shadow: ${(props) => (props.active ? '0 0 2px rgba(#dbdbdb,0.5)' : 'none')};
  border-top: ${(props) => (props.active ? '0.2rem solid #1c5de7' : 'none')};
  display: inline-block;
  height: 40px;
  line-height: 40px;
  width: 150px;
  text-align: center;
  cursor: ${(props) => (props.active ? 'unset' : 'pointer')};
`;

const ImageApiPanel = ({ editor, onEditorChange }) => {
  const [focused, setFocused] = useState(true);

  const searchGiphyImage = async (query, pageNumber, pageCount) => {
    const response = await request(`/${pluginId}/${constants.routes.searchGiphyImages}`, {
      method: 'POST',
      body: { pageNumber, query, pageCount },
    });
    return response;
  };

  const searchUnsplashImages = async (query, pageNumber, pageCount) => {
    const response = await request(`/${pluginId}/${constants.routes.searchUnsplashImages}`, {
      method: 'POST',
      body: { pageNumber, query, pageCount },
    });
    return response;
  };

  const importUnsplashImage = async (targetImage) => {
    const response = await request(`/${pluginId}/${constants.routes.importUnsplashImage}`, {
      method: 'POST',
      body: {
        targetImage,
      },
    });
    return response;
  };

  const importGiphyImage = async (targetImage) => {
    const response = await request(`/${pluginId}/${constants.routes.importGiphyImage}`, {
      method: 'POST',
      body: {
        targetImage,
      },
    });
    return response;
  };

  const [activeTab, setActiveTab] = useState(0);

  return (
    <div>
      {focused ? (
        <ImageApiSearchContainer>
          <HeaderTab
            onClick={() => {
              setActiveTab(0);
            }}
            active={activeTab === 0}
          >
            Unsplash
          </HeaderTab>
          <HeaderTab
            onClick={() => {
              setActiveTab(1);
            }}
            active={activeTab === 1}
          >
            Giphy
          </HeaderTab>
          <StyledTab
            active={activeTab === 0}
            importImage={importUnsplashImage}
            searchImages={searchUnsplashImages}
            editor={editor}
            onEditorChange={onEditorChange}
            name={constants.config.unsplash}
            platformLogo={unsplashLogo}
          />
          <StyledTab
            active={activeTab === 1}
            importImage={importGiphyImage}
            searchImages={searchGiphyImage}
            editor={editor}
            onEditorChange={onEditorChange}
            name={constants.config.giphy}
            platformLogo={giphyLogo}
          />
        </ImageApiSearchContainer>
      ) : null}
    </div>
  );
};

ImageApiPanel.propTypes = {
  editor: PropTypes.shape({ name: PropTypes.string.isRequired, value: PropTypes.string.isRequired }).isRequired,
  onEditorChange: PropTypes.func.isRequired,
};

export default ImageApiPanel;
