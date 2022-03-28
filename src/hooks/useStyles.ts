import { useLayoutEffect } from 'haunted';
import { supportsAdoptingStyleSheets } from 'lit';

declare const window: Window & {
    ShadyCSS: any;
  };

const adoptStyles = (el:any, styles:any) => {
  if (styles.length === 0) {
    return;
  }
  // There are three separate cases here based on Shadow DOM support.
  // (1) shadowRoot polyfilled: use ShadyCSS
  // (2) shadowRoot.adoptedStyleSheets available: use it
  // (3) shadowRoot.adoptedStyleSheets polyfilled: append styles after
  // rendering
  if (window.ShadyCSS !== undefined && !window.ShadyCSS.nativeShadow) {
    window.ShadyCSS.ScopingShim.prepareAdoptedCssText(
      styles.map((s:any) => s.cssText),
      el.localName
    );
  } else if (supportsAdoptingStyleSheets) {
    el.shadowRoot.adoptedStyleSheets = styles.map((s:any) =>
      s instanceof CSSStyleSheet ? s : s.styleSheet
    );
  } else {
    styles.forEach((s:any) => {
      const style = document.createElement('style');
      style.textContent = s.cssText;
      el.shadowRoot.appendChild(style);
    });
  }
};

export function useStyles(el:any, styles:any) {
  /**
   * Applies styling to the element shadowRoot using the [[`styles`]]
   * property. Styling will apply using `shadowRoot.adoptedStyleSheets` where
   * available and will fallback otherwise. When Shadow DOM is polyfilled,
   * ShadyCSS scopes styles and adds them to the document. When Shadow DOM
   * is available but `adoptedStyleSheets` is not, styles are appended to the
   * end of the `shadowRoot` to [mimic spec
   * behavior](https://wicg.github.io/construct-stylesheets/#using-constructed-stylesheets).
   */

  useLayoutEffect(() => {
    adoptStyles(el, styles);
  }, [styles]);
}
