import React, { useState } from "react";
import styled from "styled-components";
import { GlobalPagination, InputsIndex as Input } from "strapi-helper-plugin";
import ImageApiModal from "./ImageApiModal";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@buffetjs/core";
import axios from "axios";

const ImageApiSearchContainer = styled.div`
  border: 1px solid #e3e9f3;
  padding: 8px 16px;
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-wrap: wrap;
`;

const ImageApiSearchBarContainer = styled.div`
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

const ImageApiPanel = ({ editor, onEditorChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    _page: 1,
    _limit: 10,
  });
  const [targetImage, setTargetImage] = useState({});
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(true);
  const [imageList, setImageList] = useState([]);

  const onChangePage = ({ target }) => {
    const newPagination = { ...pagination, ...{ _page: target.value } };
    setPagination(newPagination);
    searchUnsplashImage(query, target.value, pagination._limit);
  };

  const searchUnsplashImage = async (query, pageNumber, pageCount) => {
    if (!query) {
      return;
    }
    const { backendURL, remoteURL } = strapi;
    const imageBaseUrl = backendURL ? backendURL : new URL(remoteURL).origin;
    const searchImageApiEndpoint = `${imageBaseUrl}/image-api/search-unsplash-images`;
    const { data } = await axios
      .post(searchImageApiEndpoint, {
        pageNumber,
        query,
        pageCount,
      })
      .catch(({ message }) => {
        alert("Failed to get images due to " + message);
      });
    setImageList(data);
  };

  const onImageClicked = async ({
    id,
    description,
    userName,
    userProfileUrl,
    src,
  }) => {
    setIsOpen(true);
    const fileName =
      description &&
      description.split(" ").length <= 10 &&
      description.length <= 100
        ? description
        : uuidv4();
    setTargetImage({ id, src, userName, userProfileUrl, fileName });
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
    const newValue = editor.value ? editor.value : "" + content;
    onEditorChange({ target: { name: editor.name, value: newValue } });
  };

  const handleSubmit = async () => {
    const { backendURL, remoteURL } = strapi;
    const imageBaseUrl = backendURL ? backendURL : new URL(remoteURL).origin;
    const imageApiEndpoint = `${imageBaseUrl}/image-api/import-unsplash-image`;
    const result = await axios.post(imageApiEndpoint, {
      id: targetImage.id,
      fileName: targetImage.fileName,
      altText: targetImage.altText,
      caption: targetImage.caption,
    });
    const { url, appName } = result.data;
    const imageUrl = `${imageBaseUrl}${url}`;
    const attributiton = `Photo by [${targetImage.userName}](${targetImage.userProfileUrl}/?utm_source=${appName}&utm_medium=referral) on [Unsplash](https://unsplash.com/?utm_source=${appName}&utm_medium=referral`;
    const content = `![](${imageUrl}) ${attributiton})`;
    onImageImported(content);
    setIsOpen(false);
  };

  return (
    <div>
      {focused ? (
        <ImageApiSearchContainer>
          <ImageApiSearchBarContainer>
            <StyledInput
              label="Search images on Unsplash"
              customBootstrapClass="col-md-12"
              placeholder="Type to search"
              type="text"
              name="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Button
              color="primary"
              onClick={async () =>
                await searchUnsplashImage(
                  query,
                  pagination._page,
                  pagination._limit
                )
              }
              type="button"
            >
              Search
            </Button>
          </ImageApiSearchBarContainer>
          {imageList.total ? (
            <ImageListContainer>
              {imageList.results.map(({ id, urls, description, user }) => {
                const { name: userName, links: userProfileLinks } = user;
                const { html: userProfileUrl } = userProfileLinks;
                const { thumb, regular } = urls;
                return (
                  <ImageItem key={id}>
                    <img
                      onClick={async () =>
                        await onImageClicked({
                          id,
                          description,
                          userName,
                          userProfileUrl,
                          src: regular,
                        })
                      }
                      src={thumb}
                    />
                  </ImageItem>
                );
              })}
              <GlobalPagination
                count={imageList.total}
                params={pagination}
                onChangeParams={onChangePage}
              />
              <ImageApiModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                targetImage={targetImage}
                setFileName={setFileName}
                setCaption={setCaption}
                setAltText={setAltText}
                handleSubmit={handleSubmit}
              />
            </ImageListContainer>
          ) : null}
        </ImageApiSearchContainer>
      ) : null}
    </div>
  );
};

export default ImageApiPanel;
