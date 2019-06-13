import React, { useRef } from 'react';
import usePannableReducer from './usePannableReducer';
import useIsomorphicLayoutEffect from './hooks/useIsomorphicLayoutEffect';
import usePrevRef from './hooks/usePrevRef';

/* eslint no-restricted-globals:"off" */

let root;

if (typeof self !== 'undefined') {
  root = self;
} else if (typeof window !== 'undefined') {
  root = window;
} else if (typeof global !== 'undefined') {
  root = global;
} else {
  root = {};
}

const defaultPannableProps = {
  enabled: true,
  shouldStart: () => true,
  onStart: () => {},
  onMove: () => {},
  onEnd: () => {},
  onCancel: () => {},
};

function Pannable({
  enabled = defaultPannableProps.enabled,
  shouldStart = defaultPannableProps.shouldStart,
  onStart = defaultPannableProps.onStart,
  onMove = defaultPannableProps.onMove,
  onEnd = defaultPannableProps.onEnd,
  onCancel = defaultPannableProps.onCancel,
  ...props
}) {
  const [state, dispatch] = usePannableReducer();
  const prevStateRef = usePrevRef(state);
  const propsRef = useRef(defaultPannableProps);
  const elemRef = useRef(null);
  const innerRef = useRef({ state, touchSupported: false });

  const prevProps = propsRef.current;
  propsRef.current = { enabled, shouldStart, onStart, onMove, onEnd, onCancel };
  innerRef.current.state = state;
  const { target, translation, velocity, interval } = state;

  useIsomorphicLayoutEffect(() => {
    function track(target, point) {
      dispatch({ type: 'track', target, point, now: new Date().getTime() });
    }

    function onTouchStart(evt) {
      innerRef.current.touchSupported = true;

      if (evt.touches && evt.touches.length === 1) {
        const touchEvent = evt.touches[0];

        track(touchEvent.target, { x: touchEvent.pageX, y: touchEvent.pageY });
      }
    }

    function onTouchMove(evt) {
      if (innerRef.current.state.translation) {
        evt.preventDefault();
      }
    }

    function onMouseDown(evt) {
      if (innerRef.current.touchSupported) {
        return;
      }

      track(evt.target, { x: evt.pageX, y: evt.pageY });
    }

    if (enabled) {
      const elemNode = elemRef.current;

      if (!elemNode.addEventListener) {
        return;
      }

      elemNode.addEventListener('touchstart', onTouchStart, false);
      elemNode.addEventListener('touchmove', onTouchMove, false);
      elemNode.addEventListener('mousedown', onMouseDown, false);

      return () => {
        elemNode.removeEventListener('touchstart', onTouchStart, false);
        elemNode.removeEventListener('touchmove', onTouchMove, false);
        elemNode.removeEventListener('mousedown', onMouseDown, false);
      };
    }
  }, [enabled, dispatch]);

  useIsomorphicLayoutEffect(() => {
    function move(point) {
      dispatch({
        type: 'move',
        point,
        now: new Date().getTime(),
        shouldStart: propsRef.current.shouldStart,
      });
    }

    function end() {
      dispatch({ type: 'end' });
    }

    function onTargetTouchMove(evt) {
      const touchEvent = evt.touches[0];

      if (innerRef.current.state.translation) {
        evt.preventDefault();
      }

      move({ x: touchEvent.pageX, y: touchEvent.pageY });
    }

    function onTargetTouchEnd(evt) {
      if (innerRef.current.state.translation) {
        evt.preventDefault();
      }

      end();
    }

    function onRootMouseMove(evt) {
      evt.preventDefault();

      move({ x: evt.pageX, y: evt.pageY });
    }

    function onRootMouseUp(evt) {
      evt.preventDefault();

      end();
    }

    if (!target) {
      return;
    }

    if (innerRef.current.touchSupported) {
      target.addEventListener('touchmove', onTargetTouchMove, false);
      target.addEventListener('touchend', onTargetTouchEnd, false);
      target.addEventListener('touchcancel', onTargetTouchEnd, false);

      return () => {
        target.removeEventListener('touchmove', onTargetTouchMove, false);
        target.removeEventListener('touchend', onTargetTouchEnd, false);
        target.removeEventListener('touchcancel', onTargetTouchEnd, false);
      };
    } else {
      root.addEventListener('mousemove', onRootMouseMove, false);
      root.addEventListener('mouseup', onRootMouseUp, false);

      return () => {
        root.removeEventListener('mousemove', onRootMouseMove, false);
        root.removeEventListener('mouseup', onRootMouseUp, false);
      };
    }
  }, [target, dispatch]);

  useIsomorphicLayoutEffect(() => {
    const prevState = prevStateRef.current;
    const output = { target, translation, velocity, interval };

    if (translation !== prevState.translation) {
      if (translation) {
        if (prevState.translation) {
          onMove(output);
        } else {
          onStart(output);
        }
      } else if (prevState.translation) {
        if (enabled) {
          onEnd(output);
        } else {
          onCancel(output);
        }
      }
    }
  });

  if (enabled !== prevProps.enabled) {
    if (!enabled) {
      dispatch({ type: 'disable' });
    }
  }

  const elemStyle = {};

  if (translation) {
    elemStyle.touchAction = 'none';
    elemStyle.pointerEvents = 'none';
  }

  props.style = { ...elemStyle, ...props.style };
  props.ref = elemRef;

  return <div {...props} />;
}

Pannable.defaultProps = defaultPannableProps;

export default Pannable;
