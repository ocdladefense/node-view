/**
 * @ocdladefense/view
 *
 * @description Here is my description.
 *
 *
 *
 */



export { vNode, View, useEffect, useState };

// Store values related to all hooks in the order they are executed.
const hooks = [];

// Index of the current hook being executed.
let hookIndex = 0;

// Store effects in with the same indices as their dependencies
// registered in hooks.
const effects = [];


let currentRoot = null;



function useState(initialValue) {
    // console.log("useState called.",idx);
    const state = hooks[hookIndex] || initialValue;

    const _idx = hookIndex;
    const setState = (newVal) => {
        hooks[_idx] = newVal;
    };

    hookIndex++;
    return [state, setState];
}



function useEffect(cb, deps) {
    console.log("UseEffect called.", hookIndex);
    effects[hookIndex] = cb;
    hooks[hookIndex] = deps;

    hookIndex++;
}



function getEvaluator(oldHooks) {

    return function evaluateEffect(fn, index) {

        
        let result = null;
        let oldDeps = oldHooks[index]; // This will always be null on the first pass.
        let deps = hooks[index];
        let execute = false;

        console.log("Evaluating effect at index", index);
        console.log(index,oldDeps,deps);

        // No previous dependency was recorded.
        // This should mean we have only completed the first render.
        // I.e., renderIndex === 0;
        if(!oldDeps) { // Everything gets executed at least once.
            execute = true;
        }
        else if(deps == []) { // Per docs, empty deps gets executed once.
            execute = false;
        }
        else if(null == deps) { // Per docs, null deps gets executed with each render.
            execute = true;
        }
        else if(Array.isArray(deps)) {
            execute = deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
        }


        // TODO: if result is a function, React interprets this as being a "cleanup" function.
        // For example, if useEffect connects to a database, result could be a function that disconnects from the database.
        if(execute) {
            result = Promise.resolve(fn());
            console.log("UseEffect callback was executed.", index);
            if(typeof result == 'function') {
                // result(deps);
            }
        }
    };
}



/**
 * @class View
 *
 * This is a description of the View class.
 */
const View = (function () {


    const NODE_SHOULD_SWAP_STATES = [
        'NODE_NO_COMPARISON',
        'NODE_DIFFERENT_TYPE',
        'NODE_NOT_EQUAL',
        'NODE_DIFFERENT_ELEMENT',
        'TEXT_NODES_NOT_EQUAL',
        // 'NODE_PROPS_CHANGED'
    ];

    /**
     * @constructs View
     * @param root
     */
    function View(root, replace = false) {
        this.root = root;
        this.shouldReplaceRoot = replace;
        this.renderCount = 0;
    }

    /**
     * @memberof View
     * @method render
     * @instance
     * @description Perform an initial paint of a virtual node structure.
     * @param {Object} vNode A virtual node structure.
     */
    function render(virtualNode, oldHooks = []) {
        

        console.log("View: Begin render algorithm.");
        

        let hookValuesDidChange = false;
        let componentDidRender = false;

        hookValuesDidChange = hooks.some((dep, i) => !Object.is(dep, oldHooks[i]));




        hookIndex = 0;


        // On first pass we create the entire node tree as HTML elements,
        // and append it to the DOM.
        if (this.renderCount === 0) {
            console.log("View: Component first render.");
            this.currentTree = virtualNode;
            let htmlNodes = createElement(virtualNode);
            console.log(virtualNode);
            this.root.appendChild(htmlNodes);
            componentDidRender = true;
            this.renderCount++;
            console.log("View: Initial render complete.");
        }



        console.log("View: HookValuesDidChange is false.");
        // Subsequent passes will update the element (if required).
        if (this.renderCount > 1 && hookValuesDidChange) {
            console.log("OLD HOOKS ARE: ", oldHooks);
            console.log("View: Begin component re-render.");
            console.log("HookValuesDidChange is: " + hookValuesDidChange);
            console.log("Changed values:");
            console.log(oldHooks, hooks);
            // idx = 0;
            virtualNode = vNode(virtualNode.meta.type, virtualNode.meta.props, []);
            this.update(virtualNode);
            componentDidRender = true;
            this.renderCount++;
            console.log("View: Component re-render complete.");
        } 

        



        // All hooks get evaluated after the initial render.
        // Subsequent renders will only evaluate hooks if dependencies have changed.
        if(componentDidRender) {
            console.log("View: Begin effect evaluation.");
            let evaluatorFunction = getEvaluator(oldHooks);
            effects.forEach(evaluatorFunction);
            console.log("View: End effect evaluation.");
        }

        // Save a reference to the current values so we can compare them on the next invocation
        // of this function.
        // @todo - we need a deep copy here.
        // If there is a difference then we will re-render the component.
        oldHooks = hooks.slice(0);

        
        console.log("View: End render algorithm (" + this.renderCount + ").");
        this.renderCount++;
        setTimeout(() => this.render(virtualNode, oldHooks), 500);
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

        // Whether to swap nodes.
        let shouldSwapNodes = NODE_SHOULD_SWAP_STATES.includes(state);


        if ($parent.nodeType == 3)
        {
            console.warn("Parent node is a text node.");
            return;
        }



        if (!oldNode)
        {
            let n = createElement(newNode);
            $parent.appendChild(n);
            return;
        }


        else if (!newNode)
        {
            if (!$parent.children[index]) {
                $parent.removeChild(
                    $parent.children[$parent.children.length - 1]
                );
            } else {
                $parent.removeChild($parent.children[index]);
            }
            return;
        }


        // Need a better name here because when only the props have changed
        // We aren't swapping the nodes, we are only modifying the HTML attributes.
        else if("NODE_PROPS_CHANGED" == state)
        {
            updateElementAttributes($parent.childNodes[index], newNode);
        }


        // Otherwise, we are replacing the entire and children.
        else if(shouldSwapNodes)
        {
            console.log("Swapping nodes: "+state);

            let n = createElement(newNode);
            console.log("oldNode:",oldNode, "newNode:",newNode);
            $parent.replaceChild(n, $parent.childNodes[index]);
        }

        // Now we will recursively evaluate the children of the node.
        // If the node has children, we will evaluate each child.
        // Not obvious, but text nodes don't have a type and should
        // have been handled before this block executes.
        if(!shouldSwapNodes && newNode.type && newNode.children)
        {
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


    
    function updateElementAttributes($el, newNode) {

        // Remove old attributes not present in the new node.
        for(let prop in $el.getAttributeNames()) {
            if(!newNode.props[prop]) {
                $el.removeAttribute(prop);
            }
        }


        let names = Object.getOwnPropertyNames(newNode.props);
        let values = newNode.props;

        // Update remaining attributes.
        for (let name of names) {

            var html5 = 'className' == name ? 'class' : name;
            if ('children' == name) continue;
            if ('dangerouslySetInnerHTML' == name)
            {
                $el.innerHTML = values[name];
                continue;
            }
            if (values[name] === null)
            {
                $el.setAttribute(html5, "true");
                continue;
            }
            else if (html5.indexOf('on') === 0)
            {
                $el.addEventListener(name.substring(2), values[name]);
                continue;
            }
            else
            {
                $el.setAttribute(html5, values[name]);
            }
        }
    }



    /**
     * @function getChangedState
     */
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
            if(propName == "children") continue;

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
View.createRoot = function (selector, shouldReplaceRoot = false) {
    let elem =
        typeof selector == 'string'
            ? document.querySelector(selector)
            : selector;
    // let root = elem.cloneNode(false);
    // elem.parentElement.replaceChild(root, elem);

    return new View(elem, shouldReplaceRoot);
};



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

    
    let virtualNode = typeof name == 'function' ? vNodeCustomElement(name, attributes, children) : vNodeHtmlElement(name, attributes, children);

    return virtualNode;
}



function vNodeHtmlElement(name, attributes, children) {
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



function vNodeCustomElement(name, attributes, children) {

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

    // We do need to evaluate the custom element function to get the vnode.
    // If the return value is not an object we obviously can't assign
    // properties to it.
    let vnode = name(attributes);

    vnode.meta = {
        synthetic: true,
        type: name,
        props: attributes
    };

    return vnode;
}




