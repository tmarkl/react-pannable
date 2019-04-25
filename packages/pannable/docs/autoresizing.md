# \<AutoResizing />

## Usage

```js
import React from 'react';
import { AutoResizing, Pad } from 'react-pannable';

class Page extends React.Component {
  render() {
    return (
      <div style={{ height: 300, backgroundColor: '#f5f5f5' }}>
        <AutoResizing>
          {size => (
            <Pad width={size.width} height={size.height}>
              <div style={{ width: size.width }}>Some thing...</div>
            </Pad>
          )}
        </AutoResizing>
      </div>
    );
  }
}
```

[![Try it on CodePen](https://img.shields.io/badge/CodePen-Try%20it-blue.svg?logo=CodePen)](https://codepen.io/cztflove/pen/MRzPXw)

## Props

#### `children`: ReactNode | (size: [Size](#size--width-number-height-number-)) => ReactNode

You can implement the function children prop for the component with current size.

#### `width`?: number

the width of the component. If not specified, it grows to fit the space available.

#### `height`?: number

the height of the component. If not specified, it grows to fit the space available.

#### `onResize`?: (size: [Size](#size--width-number-height-number-)) => void

Calls when changes the size of the component.

## APIs

#### calculateSize()

Calculates the size of the component manually.

## Types

#### `Size`: { width: number, height: number }