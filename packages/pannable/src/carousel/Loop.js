import React from 'react';
import LoopInner from './LoopInner';
import Pad from '../pad/Pad';

const defaultLoopProps = {
  direction: 'x',
  ...Pad.defaultProps,
  directionalLockEnabled: true,
};

function Loop(props) {
  const { direction, children, ...padProps } = props;

  if (direction === 'x') {
    padProps.isBoundlessX = true;
    padProps.alwaysBounceY = false;
  } else {
    padProps.isBoundlessY = true;
    padProps.alwaysBounceX = false;
  }

  return (
    <Pad {...padProps}>
      {(pad, methods) => (
        <LoopInner
          pad={pad}
          onAdjust={methods._scrollTo}
          direction={direction}
          children={children}
        />
      )}
    </Pad>
  );
}

Loop.defaultProps = defaultLoopProps;
export default Loop;
