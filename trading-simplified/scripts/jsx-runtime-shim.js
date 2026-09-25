// Maps the automatic JSX runtime onto the global React UMD build (hosted artifact build only).
import React from 'react';

export const Fragment = React.Fragment;
export function jsx(type, props, key) {
  return React.createElement(type, key === undefined ? props : { ...props, key });
}
export const jsxs = jsx;
