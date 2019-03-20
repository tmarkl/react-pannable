import React from 'react';
import { configure, addDecorator } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';
import 'normalize.css';
import Main from '../src/layout/Main';

addDecorator(
  withOptions({
    name: 'react-pannable',
    url: 'https://github.com/n43/react-pannable',
    showAddonPanel: false,
  })
);

addDecorator(story => <Main>{story()}</Main>);

// const req = require.context('../src/stories', true, /\.stories\.js$/);

function loadStories() {
  // req.keys().forEach(filename => req(filename));
  require('../src/stories/pad/index.stories');
  require('../src/stories/pannable/index.stories');
  require('../src/stories/carousel/index.stories');
}

configure(loadStories, module);
