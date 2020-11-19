import React, { useState } from 'react';
import styled from 'styled-components';
import {
  HeaderNav,
  GlobalPagination,
  InputsIndex as Input,
  request,
  prefixFileUrlWithBackendUrl,
  Button,
} from 'strapi-helper-plugin';
import ImageApiModal from './ImageApiModal';
import ImageApiTab from './ImageApiTab';
import { v4 as uuidv4 } from 'uuid';
import PropTypes from 'prop-types';
import constants from '../../../utils/constants';
import pluginId from '../../../admin/src/pluginId';
import unsplashLogo from '../../../images/Unsplash_Logo.png';
import giphyLogo from '../../../images/GIPHY_logo.png';

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

const ImageApiSearchBarContainer = styled.div`
  padding: 16px;
  flex: 1 1 100%;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const StyledInput = styled(Input)`
  padding: 0 16px 0 0;
  flex: 1 1 auto;
`;

const ImageListContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

const ImageItem = styled.div`
  flex: 0 0 20%;
  height: 150px;
  display: flex;
  flex-direction: row;
  &:hover {
    .hover-image {
      display: block;
      position: absolute;
      max-width: 400px;
      float: left;
    }
  }
  img {
    max-width: 100%;
    object-fit: cover;
    cursor: pointer;
  }
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
  const defaultPagination = {
    _page: 1,
    _limit: 10,
  };
  const [hasSearched, setHasSearched] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pagination, setPagination] = useState(defaultPagination);
  const [targetImage, setTargetImage] = useState({});
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(true);
  const [imageList, setImageList] = useState([]);

  const onChangePage = ({ target }) => {
    searchGiphyImage(query, target.value, pagination._limit);
  };

  const handleSearch = async (query) => {
    if (!query) {
      return;
    }
    await searchUnsplashImages(query, defaultPagination._page, defaultPagination._limit);
  };

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

  const onImageClicked = async (targetImage) => {
    const { originalName } = targetImage;
    setIsOpen(true);
    const fileName =
      originalName && originalName.split(' ').length <= 10 && originalName.length <= 100 ? originalName : uuidv4();
    setTargetImage({ ...targetImage, fileName });
  };
  const setFileName = (event) => {
    setTargetImage({ ...targetImage, fileName: event.target.value });
  };
  const setCaption = (event) => {
    setTargetImage({ ...targetImage, caption: event.target.value });
  };
  const setAltText = (event) => {
    setTargetImage({ ...targetImage, altText: event.target.value });
  };
  const onImageImported = (content) => {
    const newValue = editor.value ? `${editor.value} ${content}` : '' + content;
    onEditorChange({ target: { name: editor.name, value: newValue } });
  };

  const handleSubmit = async () => {
    if (!targetImage.fileName) {
      alert('File name could not be empty');
      return;
    }
    setIsImporting(true);
    const response = await request(`/${pluginId}/${constants.routes.importUnsplashImage}`, {
      method: 'POST',
      body: {
        targetImage,
      },
    })
      .catch(({ message }) => {
        alert('Failed to download image due to ' + message);
      })
      .finally(() => {
        setIsImporting(false);
      });
    const { url, appName } = response;
    const imageUrl = prefixFileUrlWithBackendUrl(url);
    const attributiton = `Photo by [${targetImage.authorName}](${targetImage.authorUrl}/?utm_source=${appName}&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=${appName}&utm_medium=referral`;
    const content = `![](${imageUrl}) ${attributiton})`;
    onImageImported(content);
    setIsOpen(false);
  };

  const [activeTab, setActiveTab] = useState(0);
  const tabInfo = [
    {
      index: 0,
      name: 'Unsplash',
    },
    {
      index: 1,
      name: 'Giphy',
    },
  ];

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
          {/* <ImageApiSearchBarContainer>
            <StyledInput
              label={`Search images on ${tabInfo[activeTab].name}`}
              customBootstrapClass="col-md-12"
              placeholder="Type to search"
              type="text"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button loader={isSearching} primary onClick={async () => await handleSearch(query)} type="button">
              Search
            </Button>
          </ImageApiSearchBarContainer>
          {imageList.totalCount ? (
            <ImageListContainer>
              {imageList.items.map((targetImage) => {
                const { id, urls } = targetImage;
                const { thumb } = urls;
                return (
                  <ImageItem key={id}>
                    <img onClick={async () => await onImageClicked(targetImage)} src={thumb} />
                  </ImageItem>
                );
              })}
              <GlobalPagination count={imageList.totalCount} params={pagination} onChangeParams={onChangePage} />
              <ImageApiModal
                isImporting={isImporting}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                targetImage={targetImage}
                setFileName={setFileName}
                setCaption={setCaption}
                setAltText={setAltText}
                handleSubmit={handleSubmit}
              />
            </ImageListContainer>
          ) : hasSearched ? (
            <div>Result not found, please refine your query</div>
          ) : null} */}
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
