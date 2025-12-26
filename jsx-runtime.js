
/**
 * JSX parsing function.
 */
export default function jsx(name, attributes, ...children) {
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