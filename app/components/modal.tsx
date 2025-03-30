import PropTypes from 'prop-types';
import ReactModal, { Props } from 'react-modal';

export const Modal: React.FC<Props> = props => {
  return (
    <ReactModal
      className="absolute left-1/2 top-1/2 -translate-x-1/2 overflow-auto rounded border-4 p-4 outline-none dark:bg-gray-800"
      overlayClassName="fixed top-0 bottom-0 right-0 left-0 bg-black bg-opacity-50"
      {...props}
    >
      {props.children}
    </ReactModal>
  );
};

Modal.propTypes = {
  children: PropTypes.node,
};
