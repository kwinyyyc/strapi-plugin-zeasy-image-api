import React, { useState } from 'react';
import {
  HeaderNav,
  GlobalPagination,
  InputsIndex as Input,
  request,
  prefixFileUrlWithBackendUrl,
  Button,
} from 'strapi-helper-plugin';
import ImageApiModal from './ImageApiModal';
import styled from 'styled-components';
import { v4 as uuidv4 } from 'uuid';
import constants from '../../../utils/constants';
import pluginId from '../../../admin/src/pluginId';

const ImageApiSearchBarContainer = styled.div`
  padding: 16px;
  flex: 1 1 100%;
  display: flex;
  flex-wrap: wrap;
  flex-direction: row;
  align-items: center;
`;

const ImageApiSearchBarItem = styled.div`
  flex: 1 1 100%;
  display: flex;
  align-items: center;
`;

const StyledInput = styled(Input)`
  padding: 0 16px 0 0;
  flex: 1 1 auto;
  margin: 0px;
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

const defaultPagination = {
  _page: 1,
  _limit: 10,
};
``;

const ImageApiTab = ({ name, editor, onEditorChange, className, searchImages, importImage, platformLogo }) => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [pagination, setPagination] = useState(defaultPagination);
  const [imageList, setImageList] = useState([]);
  const [targetImage, setTargetImage] = useState({});

  const handleSearch = async (query, page = defaultPagination._page, limit = defaultPagination._limit) => {
    if (!query) {
      return;
    }
    try {
      setIsSearching(true);
      setPagination({ _page: page, _limit: limit });
      const response = await searchImages(query, page, limit);
      setHasSearched(true);
      setImageList(response);
    } catch (message) {
      alert('Failed to get images due to ' + message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!targetImage.fileName) {
      alert('File name could not be empty');
      return;
    }
    try {
      setIsImporting(true);
      const response = await importImage(targetImage);

      const { url, appName, attribution, attributionType, attributionUrl } = response;
      const imageUrl = prefixFileUrlWithBackendUrl(url);
      const content = `![](${imageUrl})
            ${attribution}`;
      onImageImported(content);
      setIsOpen(false);
    } catch (message) {
      alert('Failed to download image due to ' + message);
    } finally {
      setIsImporting(false);
    }
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

  const onChangePage = ({ target }) => {
    handleSearch(query, target.value, pagination.limit);
  };

  return (
    <div className={className}>
      <ImageApiSearchBarContainer>
        <ImageApiSearchBarItem>
          <h3 style={{ flex: '1 1 100%', fontSize: '14px' }}>{`Search images on ${name}`}</h3>
          <span style={{ flex: '0 0 auto', paddingRight: '4px' }}>Powered by: </span>
          <img width="80px" src={platformLogo} />
        </ImageApiSearchBarItem>
        <ImageApiSearchBarItem>
          <StyledInput
            customBootstrapClass="col-md-12"
            placeholder="Type to search"
            type="text"
            name="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button
            style={{ marginBottom: '3px' }}
            loader={isSearching}
            primary
            onClick={async () => await handleSearch(query)}
            type="button"
          >
            Search
          </Button>
        </ImageApiSearchBarItem>
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
      ) : null}
    </div>
  );
};

export default ImageApiTab;
