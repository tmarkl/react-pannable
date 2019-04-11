import React from 'react';
import { getItemVisibleRect, needsRender } from './utils/visible';
import { isEqualSize } from './utils/geometry';
import ItemContent from './ItemContent';

function Item() {}

export default class ListContent extends React.Component {
  static defaultProps = {
    direction: 'y',
    width: null,
    height: null,
    spacing: 0,
    itemCount: 0,
    estimatedItemWidth: 0,
    estimatedItemHeight: 0,
    renderItem: () => null,
    visibleRect: { x: 0, y: 0, width: 0, height: 0 },
    onResize: () => {},
    connectWithPad: true,
  };

  constructor(props) {
    super(props);

    const itemHashDict = {};
    const itemSizeDict = {};

    this.state = {
      ...calculateLayout(props, itemHashDict, itemSizeDict),
      itemHashDict,
      itemSizeDict,
    };
  }

  componentDidMount() {
    const { size } = this.state;

    if (size) {
      this.props.onResize(size);
    }

    this._updateItemHashDict();
  }

  componentDidUpdate(prevProps, prevState) {
    const {
      direction,
      width,
      height,
      spacing,
      itemCount,
      estimatedItemWidth,
      estimatedItemHeight,
      onResize,
    } = this.props;
    const { size, itemHashDict, itemSizeDict } = this.state;

    if (
      direction !== prevProps.direction ||
      width !== prevProps.width ||
      height !== prevProps.height ||
      spacing !== prevProps.spacing ||
      itemCount !== prevProps.itemCount ||
      estimatedItemWidth !== prevProps.estimatedItemWidth ||
      estimatedItemHeight !== prevProps.estimatedItemHeight ||
      itemHashDict !== prevState.itemHashDict ||
      itemSizeDict !== prevState.itemSizeDict
    ) {
      this._layout();
    }
    if (prevState.size !== size) {
      if (size) {
        onResize(size);
      }
    }

    this._updateItemHashDict();
  }

  getSize() {
    return this.state.size;
  }

  getItemRect({ itemIndex }) {
    const { layoutList } = this.state;
    const attrs = layoutList[itemIndex];

    return (attrs && attrs.rect) || null;
  }

  _layout() {
    this.setState((state, props) => {
      const { size, itemHashDict, itemSizeDict } = state;
      const nextState = {};

      const layout = calculateLayout(props, itemHashDict, itemSizeDict);

      nextState.fixed = layout.fixed;
      nextState.layoutList = layout.layoutList;

      if (!isEqualSize(layout.size, size)) {
        nextState.size = layout.size;
      }

      return nextState;
    });
  }

  _updateItemHashDict() {
    this.setState(state => {
      if (!this._itemHashDict) {
        return null;
      }

      const itemHashDict = { ...state.itemHashDict, ...this._itemHashDict };
      this._itemHashDict = undefined;

      return { itemHashDict };
    });
  }

  _renderItem(layoutAttrs) {
    const { renderItem } = this.props;
    const { fixed, itemHashDict, itemSizeDict } = this.state;

    const { itemIndex, rect, visibleRect, needsRender, Item } = layoutAttrs;
    let element = renderItem(layoutAttrs);
    let itemStyle = {
      position: 'absolute',
      left: rect.x,
      top: rect.y,
      width: rect.width,
      height: rect.height,
    };
    let forceRender;
    let hash;
    let key;

    if (React.isValidElement(element) && element.type === Item) {
      if (element.props.style) {
        itemStyle = { ...itemStyle, ...element.props.style };
      }
      forceRender = element.props.forceRender;
      hash = element.props.hash;
      key = element.key;

      element = element.props.children;
    }

    if (!key) {
      key = '' + itemIndex;
    }
    if (hash === undefined) {
      hash = key;
    }

    if (itemHashDict[itemIndex] !== hash) {
      if (!this._itemHashDict) {
        this._itemHashDict = {};
      }
      this._itemHashDict[itemIndex] = hash;
    }

    if (!forceRender && !needsRender) {
      return null;
    }

    if (!React.isValidElement(element) || !element.props.connectWithPad) {
      element = <ItemContent>{element}</ItemContent>;
    }
    if (element.props.style) {
      itemStyle = { ...itemStyle, ...element.props.style };
    }

    const onResize = element.props.onResize;
    const elemProps = {
      key,
      ref: element.ref,
      style: itemStyle,
      visibleRect,
      onResize: size => {
        this.setState(state => ({
          itemSizeDict: { ...state.itemSizeDict, [hash]: size },
        }));

        onResize(size);
      },
    };

    const itemSize = itemSizeDict[hash];

    if (itemSize) {
      if (typeof element.props.width !== 'number') {
        elemProps.width = itemSize.width;
      }
      if (typeof element.props.height !== 'number') {
        elemProps.height = itemSize.height;
      }
    } else {
      if (
        typeof fixed.height === 'number' &&
        typeof element.props.height !== 'number'
      ) {
        elemProps.height = fixed.height;
      }
      if (
        typeof fixed.width === 'number' &&
        typeof element.props.width !== 'number'
      ) {
        elemProps.width = fixed.width;
      }
    }

    return React.cloneElement(element, elemProps);
  }

  render() {
    const {
      direction,
      width,
      height,
      spacing,
      itemCount,
      estimatedItemWidth,
      estimatedItemHeight,
      renderItem,
      visibleRect,
      onResize,
      connectWithPad,
      ...props
    } = this.props;
    const { size, layoutList } = this.state;

    const elemStyle = { position: 'relative' };

    if (size) {
      elemStyle.width = size.width;
      elemStyle.height = size.height;
    }

    props.style = {
      ...elemStyle,
      ...props.style,
    };

    const items = [];

    for (let itemIndex = 0; itemIndex < layoutList.length; itemIndex++) {
      const attrs = layoutList[itemIndex];
      const layoutAttrs = {
        ...attrs,
        itemIndex,
        visibleRect: getItemVisibleRect(attrs.rect, visibleRect),
        needsRender: needsRender(attrs.rect, visibleRect),
        Item,
      };

      items.push(this._renderItem(layoutAttrs));
    }

    props.children = items;

    return <div {...props} />;
  }
}

function calculateLayout(props, itemHashDict, itemSizeDict) {
  const { direction, spacing, itemCount } = props;
  const size = { width: props.width, height: props.height };
  const estimatedItemSize = {
    width: props.estimatedItemWidth,
    height: props.estimatedItemHeight,
  };

  const [x, y, width, height] =
    direction === 'x'
      ? ['y', 'x', 'height', 'width']
      : ['x', 'y', 'width', 'height'];

  let sizeWidth = 0;
  let sizeHeight = 0;
  const layoutList = [];
  const fixed = {};

  if (typeof size[width] === 'number') {
    fixed[width] = size[width];
  }

  for (let itemIndex = 0; itemIndex < itemCount; itemIndex++) {
    const itemHash = itemHashDict[itemIndex];
    let itemSize = itemSizeDict[itemHash] || {
      [width]:
        fixed[width] === undefined ? estimatedItemSize[width] : fixed[width],
      [height]: estimatedItemSize[height],
    };

    layoutList.push({
      rect: {
        [x]: 0,
        [y]: sizeHeight,
        [width]: itemSize[width],
        [height]: itemSize[height],
      },
    });

    if (itemSize[height] > 0) {
      sizeHeight += itemSize[height];

      if (itemIndex < itemCount - 1) {
        sizeHeight += spacing;
      }
    }
    if (sizeWidth < itemSize[width]) {
      sizeWidth = itemSize[width];
    }
  }

  return {
    size: { [width]: sizeWidth, [height]: sizeHeight },
    fixed,
    layoutList,
  };
}
