// utils/sanitize.js
const { JSDOM } = require('jsdom');
const createDOMPurify = require('dompurify');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

module.exports = {
  sanitizeHTML: (dirty) => {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol', 'li', 'b', 'i', 'strong', 'em', 'strike', 'br', 'div', 'span', 'img', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'colgroup', 'col', 'caption'],
      ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'style', 'target', 'rel', 'title', 'data-list', 'data-indent', 'colspan', 'rowspan', 'scope', 'width', 'height', 'cellpadding', 'cellspacing', 'border']
    });
  }
};
