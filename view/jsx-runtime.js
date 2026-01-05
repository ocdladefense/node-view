
/*
  _jsx(): This function is used by the compiler for JSX elements that have dynamic children (e.g., <MyComponent>{someVariable}</MyComponent>).

  _jsxs(): The "s" stands for "static" or "spanning". This is an optimization used for elements with multiple, static children.  For example:
  
    <div>
      <span>Static 1</span>
      <span>Static 2</span>
    </div>
    
    It handles children more efficiently by passing them as a single, combined array, which allows for better performance by skipping certain runtime checks and manipulations.

  Performance: The primary benefit of the jsxs() function is a performance improvement. By optimizing the handling of static children, it can potentially result in smaller bundle sizes and slightly faster rendering, as it avoids array slicing and other runtime overheads associated with the older React.createElement or jsx() methods for these specific cases. 
*/


/**
 * JSX parsing function.
 */
export default function vNode(name, attributes, ...children) {


    return typeof name == 'function' ? vNodeCustomElement(name, attributes, children) : vNodeHtmlElement(name, attributes, children);
}


export function jsxs(name, attributes, children) {
    return vNode(name, attributes, children);
}


export function Fragment(attributes, ...children) {

    return {
        type: 'Fragment',
        props: attributes || {},
        children: attributes && attributes.children ? attributes.children : children
    };
}

function vNodeHtmlElement(name, attributes, children) {
    attributes = attributes || {};
    let joined = [];
    if (
        children.length == 0 ||
        null == children[0] ||
        typeof children[0] == 'undefined'
    )
    {
        joined = [];
    } else if (children.length == 1 && typeof children[0] == 'string')
    {
        joined = children;
    } else
    {
        for (var i = 0; i < children.length; i++)
        {
            if (Array.isArray(children[i]))
            {
                joined = joined.concat(children[i]);
            } else
            {
                joined.push(children[i]);
            }
        }
    }

    joined = joined.filter(child => !!child);
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
    )
    {
        joined = [];
    } else if (children.length == 1 && typeof children[0] == 'string')
    {
        joined = children;
    } else
    {
        for (var i = 0; i < children.length; i++)
        {
            if (Array.isArray(children[i]))
            {
                joined = joined.concat(children[i]);
            } else
            {
                joined.push(children[i]);
            }
        }
    }

    joined = joined.filter(child => !!child);
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




