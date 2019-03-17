import React from 'react';
import StyleSheet from './utils/StyleSheet';

const MIN_DISTANCE = 0;

export default class Pannable extends React.PureComponent {
  static defaultProps = {
    enabled: true,
    shouldStart: () => true,
    onStart: () => {},
    onMove: () => {},
    onEnd: () => {},
    onCancel: () => {},
  };

  state = {
    target: null,
    translation: null,
    interval: null,
    velocity: null,
    startPoint: null,
    movePoint: null,
    moveTime: null,
  };

  elemRef = React.createRef();

  componentDidUpdate(prevProps) {
    const { enabled } = this.props;

    if (prevProps.enabled !== enabled && !enabled) {
      this._cancel();
    }
  }

  componentWillUnmount() {
    this._removeMousePanListener();
  }

  _track(evt) {
    this.setState({
      startPoint: { x: evt.pageX, y: evt.pageY },
      movePoint: { x: evt.pageX, y: evt.pageY },
      moveTime: new Date().getTime(),
    });
  }
  _move(evt) {
    evt = { target: evt.target, pageX: evt.pageX, pageY: evt.pageY };

    this.setState((state, props) => {
      const { shouldStart, onStart, onMove } = props;
      const { target, startPoint, movePoint, moveTime } = state;

      if (!startPoint) {
        return null;
      }

      const nextMoveTime = new Date().getTime();
      const interval = nextMoveTime - moveTime;
      const nextMovePoint = { x: evt.pageX, y: evt.pageY };

      const nextState = {
        translation: {
          x: nextMovePoint.x - startPoint.x,
          y: nextMovePoint.y - startPoint.y,
        },
        velocity: {
          x: (nextMovePoint.x - movePoint.x) / interval,
          y: (nextMovePoint.y - movePoint.y) / interval,
        },
        interval,
        movePoint: nextMovePoint,
        moveTime: nextMoveTime,
      };

      if (!target) {
        if (
          Math.sqrt(
            nextState.translation.x * nextState.translation.x +
              nextState.translation.y * nextState.translation.y
          ) > MIN_DISTANCE
        ) {
          if (
            shouldStart({
              target: evt.target,
              translation: nextState.translation,
              velocity: nextState.velocity,
              interval: nextState.interval,
            })
          ) {
            nextState.target = evt.target;
            nextState.startPoint = { x: evt.pageX, y: evt.pageY };
            nextState.translation = { x: 0, y: 0 };

            onStart({
              target: nextState.target,
              translation: nextState.translation,
              velocity: nextState.velocity,
              interval: nextState.interval,
            });
          }
        }
      } else {
        onMove({
          target,
          translation: nextState.translation,
          velocity: nextState.velocity,
          interval: nextState.interval,
        });
      }

      return nextState;
    });
  }
  _end() {
    this.setState((state, props) => {
      const { target, translation, velocity, interval } = state;

      if (target) {
        props.onEnd({ target, translation, velocity, interval });
      }

      return {
        target: null,
        translation: null,
        velocity: null,
        interval: null,
        startPoint: null,
        movePoint: null,
        moveTime: null,
      };
    });
  }
  _cancel() {
    this.setState((state, props) => {
      const { target, translation, velocity, interval } = state;

      if (target) {
        props.onCancel({ target, translation, velocity, interval });
      }

      return {
        target: null,
        translation: null,
        velocity: null,
        interval: null,
        startPoint: null,
        movePoint: null,
        moveTime: null,
      };
    });
  }

  _onTouchStart = evt => {
    const { enabled, onTouchStart } = this.props;

    if (evt.touches && evt.touches.length === 1) {
      if (enabled) {
        this._track(evt.touches[0]);
      }
    }

    if (onTouchStart) {
      onTouchStart(evt);
    }
  };
  _onTouchMove = evt => {
    const { onTouchMove } = this.props;

    if (evt.touches && evt.touches.length === 1) {
      this._move(evt.touches[0]);
    }

    if (onTouchMove) {
      onTouchMove(evt);
    }
  };
  _onTouchEnd = evt => {
    const { onTouchEnd } = this.props;

    if (evt.changedTouches && evt.changedTouches.length === 1) {
      this._end();
    }

    if (onTouchEnd) {
      onTouchEnd(evt);
    }
  };
  _onTouchCancel = evt => {
    const { onTouchCancel } = this.props;

    if (evt.changedTouches && evt.changedTouches.length === 1) {
      this._end();
    }

    if (onTouchCancel) {
      onTouchCancel(evt);
    }
  };

  _addMousePanListener() {
    const doc = document.documentElement;

    doc.addEventListener('mousemove', this._onMouseMove, false);
    doc.addEventListener('mouseup', this._onMouseUp, false);
  }
  _removeMousePanListener() {
    const doc = document.documentElement;

    doc.removeEventListener('mousemove', this._onMouseMove, false);
    doc.removeEventListener('mouseup', this._onMouseUp, false);
  }
  _onMouseDown = evt => {
    const { enabled, onMouseDown } = this.props;

    this._shouldPreventClick = enabled;

    if (enabled) {
      this._addMousePanListener();
      this._track(evt);
    }

    if (onMouseDown) {
      onMouseDown(evt);
    }
  };
  _onMouseMove = evt => {
    evt.preventDefault();
    this._move(evt);
  };
  _onMouseUp = evt => {
    evt.preventDefault();
    this._removeMousePanListener();
    this._end();
  };

  _onClick = evt => {
    const { onClick } = this.props;

    if (this._shouldPreventClick) {
      evt.preventDefault();
    }
    this._shouldPreventClick = false;

    if (onClick) {
      onClick(evt);
    }
  };

  render() {
    const {
      enabled,
      shouldStart,
      onStart,
      onMove,
      onEnd,
      onCancel,
      style,
      ...elemProps
    } = this.props;
    const styles = StyleSheet.create({
      touchAction: enabled ? 'none' : 'auto',
      ...style,
    });

    return (
      <div
        {...elemProps}
        ref={this.elemRef}
        style={styles}
        onTouchStart={this._onTouchStart}
        onTouchEnd={this._onTouchEnd}
        onTouchMove={this._onTouchMove}
        onTouchCancel={this._onTouchCancel}
        onMouseDown={this._onMouseDown}
        onClick={this._onClick}
      />
    );
  }
}
