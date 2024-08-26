/**
 * @ocdladefense/view
 *
 * @description Here is my description.
 *
 *
 *
 */

// Array of functions that will be executed before each view is rendered.
const effectsFns = {};

// Object containing the results of each effect function.
const results = {};

export { vNode, View, useEffect, getResult };
// import { CACHE, HISTORY } from "./cache.js";

function useEffect(key, fn) {
    effectsFns[key] = fn;
}

function getResult(key) {
    return results[key];
}

async function resolveEffects() {
    let foobar = Object.values(effectsFns);
    let _results = await Promise.all(foobar.map(fn => fn()));
    let i = 0;
    for (const key of Object.keys(effectsFns)) {
        results[key] = _results[i++];
    }
}

/**
 * @class View
 *
 * This is a description of the View class.
 */
const View = (function () {
    const NODE_CHANGED_STATES = [
        'NODE_NO_COMPARISON',
        'NODE_DIFFERENT_TYPE',
        'NODE_NOT_EQUAL',
        'NODE_DIFFERENT_ELEMENT',
        'NODE_PROPS_CHANGED',
        'TEXT_NODES_NOT_EQUAL'
    ];

    /**
     * @constructs View
     * @param root
     */
    function View(root) {
        this.root = root;
        //document.getElementById("order-history-main").addEventListener("click", myAppEventHandler);
        //root.addEventListener("click", myAppEventHandler);
    }

    /**
     * @memberof View
     * @method render
     * @instance
     * @description Perform an initial paint of a virtual node structure.
     * @param {Object} vNode A virtual node structure.
     */
    async function render(vNode) {
        // Components can register effects to be run before rendering.
        // These should be understood as "this component needs the effect (or result) of exeecuting some function before it can render".
        // Components can then use the result of these functions through the getResult(key) function.
        // This also implies that components are at least evaluated twice at startup: once to register the effect and once to start the initial render.

        // Run through the component functions once to gather all the effects.
        evaluateEffects(vNode);
        await resolveEffects();
        console.log('Effects resolved.');
        console.log(results);

        // Note render the tree.
        this.currentTree = vNode;
        let $newNode = createElement(vNode);

        this.root.innerHTML = '';
        this.root.appendChild($newNode);
    }

    function update(newNode) {
        updateElement(this.root, newNode, this.currentTree);

        this.currentTree = newNode;
    }

    /**
     * @memberof View
     * @method updateElement
     * @instance
     * @description Perform an initial paint of a virtual node structure.
     * @param {DOMNode} $parent
     * @param {vNode} newNode Then new virtual node tree to be rendered.
     * @param {vNode} oldNode The old virtual node tree to be diffed.
     * @param {Integer} index The current index of a recursive structure.
     */
    function updateElement($parent, newNode, oldNode, index = 0) {
        let state = getChangeState(newNode, oldNode);

        // Whether to use replaceChild to swap nodes.
        let shouldSwapNodes = changed(state);

        // Whether this current evaluation is a synthetic node.
        let isSynthetic = newNode && typeof newNode.type === 'function';

        if ($parent.nodeType == 3) {
            return;
        }

        if (!oldNode) {
            let n = View.createElement(newNode);
            $parent.appendChild(n);
        } else if (!newNode) {
            if (!$parent.children[index]) {
                $parent.removeChild(
                    $parent.children[$parent.children.length - 1]
                );
            } else {
                $parent.removeChild($parent.children[index]);
            }
        } else if (isSynthetic) {
            if (
                newNode.type &&
                newNode.type.prototype &&
                newNode.type.prototype.render
            ) {
                let obj = new newNode.type(newNode.props);
                newNode = obj.render();
            } else {
                newNode =
                    typeof newNode.type === 'function'
                        ? newNode.type(newNode.props)
                        : newNode;
            }

            if (
                oldNode.type &&
                oldNode.type.prototype &&
                oldNode.type.prototype.render
            ) {
                let obj = new oldNode.type(oldNode.props);
                oldNode = obj.render();
            } else
                oldNode =
                    typeof oldNode.type === 'function'
                        ? oldNode.type(oldNode.props)
                        : oldNode;
            updateElement($parent, newNode, oldNode, index);
        } else if (!isSynthetic && shouldSwapNodes) {
            let n = createElement(newNode);

            if (newNode.type) {
                $parent.replaceChild(n, $parent.childNodes[index]);
            } else {
                $parent.replaceChild(n, $parent.childNodes[index]);
            }
        }

        // Not obvious, but text nodes don"t have a type and should
        // have been handled before this block executes.
        else if (newNode.type && newNode.children) {
            const newLength = newNode.children.length;
            const oldLength = oldNode.children.length;

            for (let i = 0; i < newLength || i < oldLength; i++) {
                let nextParent = $parent.childNodes[index];
                let revisedNode = newNode.children[i];
                let expiredNode = oldNode.children[i];
                let equal = revisedNode == expiredNode;
                if (equal) continue;

                updateElement(nextParent, revisedNode, expiredNode, i);
            }
        }
    }

    function getChangeState(n1, n2) {
        if (n1 && !n2) return 'NODE_NO_COMPARISON';

        if (n1 == n2) return 'NODE_NO_CHANGE';

        // Comparing two text nodes that are obviously different.
        if (typeof n1 === 'string' && typeof n2 === 'string' && n1 !== n2) {
            return 'TEXT_NODES_NOT_EQUAL';
        }

        if (typeof n1 !== typeof n2) {
            return 'NODE_DIFFERENT_TYPE';
        }

        if (n1.type !== n2.type) {
            return 'NODE_DIFFERENT_ELEMENT';
        }

        if (propsChanged(n1, n2)) {
            return 'NODE_PROPS_CHANGED';
        }

        if (n1 != n2) {
            return 'NODE_RECURSIVE_EVALUATE';
        }

        return 'NODE_NO_CHANGE';
    }

    function changed(state) {
        return NODE_CHANGED_STATES.includes(state);
    }

    function propsChanged(node1, node2) {
        let node1Props = node1.props;
        let node2Props = node2.props;

        if (typeof node1Props != typeof node2Props) {
            return true;
        }

        if (!node1Props && !node2Props) {
            return false;
        }

        let aProps = Object.getOwnPropertyNames(node1Props);
        let bProps = Object.getOwnPropertyNames(node2Props);

        if (aProps.length != bProps.length) {
            return true;
        }

        for (let i = 0; i < aProps.length; i++) {
            let propName = aProps[i];

            if (node1Props[propName] !== node2Props[propName]) {
                return true;
            }
        }

        return false;
    }

    View.prototype = {
        render: render,
        update: update,
        createElement: createElement
    };

    return View;
})();

/**
 * Return a View instance from the given DOM element or selector.
 *
 * @param {string} selector
 * @returns {View}
 */
View.createRoot = function (selector) {
    let elem =
        typeof selector == 'string'
            ? document.querySelector(selector)
            : selector;
    let root = elem.cloneNode(false);
    elem.parentElement.replaceChild(root, elem);

    return new View(root);
};

function evaluateEffects(vnode) {
    return createElement(vnode);
}

/**
 * @memberof View
 * @method createElement
 * @description Recursively transform a virtual node structure into a DOM node tree.
 * @param {Object} vnode A virtual node structure.
 * @returns DOMElement
 */
function createElement(vnode) {
    if (typeof vnode === 'string' || typeof vnode === 'number') {
        return document.createTextNode(vnode.toString());
    }
    if (vnode.type == 'text') {
        return document.createTextNode(vnode.children);
    }
    //first check to see if component references a class name
    if (
        typeof vnode.type == 'function' &&
        vnode.type.prototype &&
        vnode.type.prototype.render
    ) {
        console.log('vNode is a class reference');
        let obj = new vnode.type(vnode.props);
        let render = obj.render();
        let node = createElement(render);
        //BACKTO
        // Let the component know about its own root.
        // obj.setRoot(node);
        return node;
    }
    if (typeof vnode.type == 'function') {
        let fn = vnode.type(vnode.props);
        return createElement(fn);
    }

    var $el =
        vnode.type == 'Fragment'
            ? document.createDocumentFragment()
            : document.createElement(vnode.type);
    var theClassNames;
    var theEventKey;

    if (vnode.props) {
        //var html5 = "className" == prop ? "class" : prop;
        theClassNames = vnode.props['class'];
        if (theClassNames) {
            theClassNames = theClassNames.split(' '); //hack, get better way of obtaining names, this one only gets the first
            // theEventKey = theClassNames[0];
        }
    }

    //BACKTO
    for (var prop in vnode.props) {
        var html5 = 'className' == prop ? 'class' : prop;
        if ('children' == prop) continue;
        if ('dangerouslySetInnerHTML' == prop) {
            $el.innerHTML = vnode.props[prop];
            continue;
        }
        if (prop.indexOf('on') === 0) {
            $el.addEventListener(prop.substring(2), vnode.props[prop]);
            continue;
        } else if (vnode.props[prop] === null) {
            continue;
        } else {
            $el.setAttribute(html5, vnode.props[prop]);
        }
    }

    if (null != vnode.children) {
        vnode.children.map(createElement).forEach($el.appendChild.bind($el));
    }

    return $el;
}

View.createElement = createElement;

/**
 * JSX parsing function.
 */
function vNode(name, attributes, ...children) {
    attributes = attributes || {};
    let joined = [];
    if (
        children.length == 0 ||
        null == children[0] ||
        typeof children[0] == 'undefined'
    ) {
        joined = [];
    } else if (children.length == 1 && typeof children[0] == 'string') {
        joined = children;
    } else {
        for (var i = 0; i < children.length; i++) {
            if (Array.isArray(children[i])) {
                joined = joined.concat(children[i]);
            } else {
                joined.push(children[i]);
            }
        }
    }

    attributes.children = joined;

    var vnode = {
        type: name,
        props: attributes,
        children: joined
    };

    return vnode;
}

async function refresh() {
    let hash;
    let params;
    [hash, params] = parseHash(window.location.hash);
    let tree;
    let c;

    let elem = document.querySelector('#job-container');
    if (elem) {
        elem.removeEventListener('click', this.currentComponent);
    }

    if (hash == '' || hash == '#') {
        c = new JobList();
    } else if (hash == '#new') {
        c = new JobForm();
    } else if (hash.startsWith('#edit')) {
        c = new JobForm(params.id);
    } else if (hash.startsWith('#details')) {
        c = new JobSearch(params.id);
    }

    c.listenTo('click', '#job-container');
    /*
        Listen for submit events
        c.listenTo("submit", "#record-form");
        */

    if (c.loadData) {
        await c.loadData();
    }
    tree = c.render();

    this.view.render(tree);
    this.currentComponent = c;
}
