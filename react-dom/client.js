import { View } from "./View.js";






/**
 * Return a View instance from the given DOM element or selector.
 *
 * @param {string} selector
 * @returns {View}
 */
export default function createRoot(selector, shouldReplaceRoot = false) {
    let elem =
        typeof selector == 'string'
            ? document.querySelector(selector)
            : selector;
    // let root = elem.cloneNode(false);
    // elem.parentElement.replaceChild(root, elem);

    return new View(elem, shouldReplaceRoot);
};





