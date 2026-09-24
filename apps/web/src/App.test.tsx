import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './App.js';

describe('App', () => {
  it('renders the project name', () => {
    expect(renderToString(<App />)).toContain('ZYBRILKA');
  });
});
