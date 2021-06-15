/**
 * @param typesetDelay milliseconds between calls to MathJax.typeset
 */
export function loadMathjax(typesetDelay: number) {
  (<any> window).MathJax = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']]
    },
    svg: {
      fontCache: 'global'
    }
  }

  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js';
  script.async = true;
  document.head.appendChild(script);

  (function typesetForever() {
    window.setTimeout(typesetForever, typesetDelay)
    if ((<any> window).MathJax.typeset !== undefined) { // done loading
      ;(<any> window).MathJax.typeset()
    }
  })()
}
