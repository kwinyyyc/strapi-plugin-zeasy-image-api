import React from 'react';
import { Modal, ModalBody, ModalFooter, HeaderModalTitle, Button, InputsIndex as Input } from 'strapi-helper-plugin';
import styled from 'styled-components';

const StyledImg = styled.img`
  position: static;
  flex: 1 1 100%;
  object-fit: cover;
  max-width: 100%;
  max-height: 400px;
`;

const FormWrapper = styled.div`
  margin-top: 22px;
`;

const ModalSection = styled.section`
  display: flex;
  padding: 0 30px;
`;

const Wrapper = styled.div`
  width: 100%;
  padding-top: 18px;
`;

const ModalHeaderWrapper = styled.div`
  height: 59px;
  line-height: 59px;
  background-color: '#fafafa';
  color: '#333740';
  font-size: '13px';
  font-weight: 600;
`;

const ModalHeader = ({ children }) => {
  return (
    <ModalHeaderWrapper>
      <ModalSection>
        <HeaderModalTitle>{children}</HeaderModalTitle>
      </ModalSection>
    </ModalHeaderWrapper>
  );
};

const ImageApiModal = ({
  isOpen,
  setIsOpen,
  isImporting,
  targetImage,
  setFileName,
  setCaption,
  setAltText,
  handleSubmit,
}) => {
  const handleToggle = () => {
    // eslint-disable-next-line no-alert
    const confirm = window.confirm('Confirm to close without save?');

    if (!confirm) {
      return;
    }
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setIsOpen(false);
  };
  return (
    <Modal isOpen={isOpen} onToggle={handleToggle} onClosed={handleCloseModal}>
      <ModalHeader>Details</ModalHeader>
      <ModalBody>
        <form style={{ width: '100%' }}>
          <ModalSection>
            <Wrapper>
              <div className="row">
                <div className="col-6 row">
                  {targetImage && targetImage.src ? <StyledImg src={targetImage.src} /> : null}
                </div>
                <div className="col-6">
                  <FormWrapper>
                    <div className="col-12">
                      <Input
                        className="col-md-12 col-12"
                        label="File name"
                        placeholder="Input filename"
                        onChange={setFileName}
                        type="text"
                        value={targetImage.fileName}
                      />
                    </div>
                    <div className="col-12">
                      <Input
                        className="col-md-12 col-12"
                        label="Alternative text"
                        placeholder="Input alternative text (Optional)"
                        onChange={setAltText}
                        type="text"
                        value={targetImage.altText}
                      />
                    </div>
                    <div className="col-12">
                      <Input
                        className="col-md-12 col-12"
                        label="Caption"
                        placeholder="Input caption (Optional)"
                        onChange={setCaption}
                        type="text"
                        value={targetImage.caption}
                      />
                    </div>
                  </FormWrapper>
                </div>
              </div>
            </Wrapper>
            <input ref={null} type="file" multiple={false} style={{ display: 'none' }} />
            <button type="submit" style={{ display: 'none' }}>
              hidden button to make to get the native form event
            </button>
          </ModalSection>
        </form>
      </ModalBody>
      <ModalFooter>
        <section>
          <Button type="button" secondary onClick={handleToggle}>
            Cancel
          </Button>
          <Button loader={isImporting} type="button" primary onClick={handleSubmit}>
            Submit
          </Button>
        </section>
      </ModalFooter>
    </Modal>
  );
};

export default ImageApiModal;
