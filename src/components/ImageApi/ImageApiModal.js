import React from 'react';
import { Modal, ModalBody, ModalFooter, HeaderModalTitle } from 'strapi-helper-plugin';
import styled from 'styled-components';
import { Inputs } from '@buffetjs/custom';
import { Button } from '@buffetjs/core';
import { Container } from 'reactstrap';

const StyledImg = styled.img`
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

const ContainerFluid = styled(Container)`
  padding: 0;
`;

const Wrapper = styled(ContainerFluid)`
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

const ImageApiModal = ({ isOpen, setIsOpen, targetImage, setFileName, setCaption, setAltText, handleSubmit }) => {
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
                      <Inputs label="File name" onChange={setFileName} type="text" value={targetImage.fileName} />
                    </div>
                    <div className="col-12">
                      <Inputs
                        description="This text will be displayed if the asset can’t be shown."
                        label="Alternative text"
                        onChange={setAltText}
                        type="text"
                        value={targetImage.altText}
                      />
                    </div>
                    <div className="col-12">
                      <Inputs label="Caption" onChange={setCaption} type="text" value={targetImage.caption} />
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
          <Button type="button" color="cancel" onClick={handleToggle}>
            Cancel
          </Button>
          <Button type="button" color="success" onClick={handleSubmit}>
            Submit
          </Button>
        </section>
      </ModalFooter>
    </Modal>
  );
};

export default ImageApiModal;
