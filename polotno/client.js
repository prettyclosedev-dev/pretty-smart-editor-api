import React from 'react';
import ReactDOM from 'react-dom/client';
import { Workspace } from 'polotno/canvas/workspace';
import { createStore } from 'polotno/model/store';
import { toggleFadeInAnimation } from 'polotno/canvas/use-fadein';
import {
  unstable_setTextOverflow,
  unstable_useHtmlTextRender,
  unstable_setTextVerticalResizeEnabled,
  onLoadError,
} from 'polotno/config';

import { addGlobalFont } from 'polotno/utils/fonts';
import { POLOTNO_KEY } from './config';

toggleFadeInAnimation(false);
unstable_setTextOverflow('change-font-size');
unstable_setTextVerticalResizeEnabled(true);

const key = new URLSearchParams(location.search).get('key');

const store = createStore({
  key: key || POLOTNO_KEY,
});

window.store = store;
window.config = {
  addGlobalFont,
  unstable_useHtmlTextRender,
  unstable_setTextVerticalResizeEnabled,
  onLoadError,
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Workspace store={store} />);
