// import { hooks, isStateChanged, resetHookIndex, effects, getEvaluator } from "@ocdla/view/hooks.js";
import { View } from "./View.js";


let currentRoot = null;


// Version 1.0.
/*
export function createRoot(rootElement, props = {}) {


    return {
        render: function render(component, previousStates = {}) {
            let renderTree;


            if (renderCount === 0 || isStateChanged(previousStates, states))
            {
                console.log("Render count: ", renderCount);
                previousStates = { ...states };
                renderTree = component(props);
                // After executing the component function, new states will have been assigned to this modules states object.
                rootElement.innerHTML = "";
                rootElement.appendChild(renderTree);
                renderCount++;
            }

            setTimeout(() => { render(component, previousStates); }, 500);
        }
    };
}
*/



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






