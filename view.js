/**
 * @ocdladefense/view
 *
 * @description
 *
 *
 *
 */

export { elem, linkContainer, vNode, createElement, render, updateElement, tree, parseComponent, nodeList, myAppEventHandler, getDefinedActions, addEvent, changeMainContainer, getMainContainer, postRenderEventHelper };

import { CACHE, HISTORY } from './cache.js';



const myEvents = {};


/*
domEvents = {
    ".event-list-item": {
        eventType: "click", 
        callback: fn
    }
}
*/
const domEvents = {};

let mainContainer;


function elem(elementName, attributes, text) {
    var element = document.createElement(elementName);
    
    if(text != null)
    {
        element.appendChild(document.createTextNode(text));
    }

    for(var prop in attributes)
    {
        var propName = prop == "className" ? "class" : prop;
        
        element.setAttribute(propName, attributes[prop]);
    }

    return element;
}




function linkContainer(link) {
    var tableCellLink = vNode("a", {href:link},"View/download material");
    var tableCellLinkContainer = vNode("div",{className:"Rtable-cell link"},[tableCellLink]);

    return tableCellLinkContainer;
}


/*TODO
figure out what to do when our text value is undefined. 
For example, when JSX evaluates a variable and its value is undefined and its value is used as a text node.

*/
function vNode(name,attributes,...children) {
    let joined = [];
    if(children.length == 0 || null == children[0] || typeof children[0] == "undefined") {
        joined = [];
    } else if(children.length == 1 && typeof children[0] == "string") {
        joined = children;
    } else {
        //children = Array.isArray(children) ? children : [children];
        //console.log(children);
        //flatten method?
        for(var i = 0; i<children.length; i++) {
            if(Array.isArray(children[i])) {
                joined = joined.concat(children[i]);
            } else {
                joined.push(children[i]);
            }
        }
    }
            
    var vnode =  {    
            type: name,
            props: attributes,
            children: joined
    };
    
    return vnode;
}



function createElement(vnode) {
    if(typeof vnode === "string") {
        return document.createTextNode(vnode);
    }
    if(vnode.type == "text") {
        return document.createTextNode(vnode.children);
    }
    if(typeof vnode.type == "function") {
        let temp = vnode.type(vnode.props);
        return createElement(temp);
    }

    var $el = document.createElement(vnode.type);
    var theClassNames;
    var theEventKey;

    if (vnode.props) {
        //var html5 = "className" == prop ? "class" : prop;
        theClassNames = vnode.props["class"];
        if (theClassNames) {
            theClassNames = theClassNames.split(" "); //hack, get better way of obtaining names, this one only gets the first
            theEventKey = theClassNames[0];    
        }
    }
    
    
    for(var prop in vnode.props) {
        var html5 = "className" == prop ? "class" : prop;
        
        if (prop[0] == "o" && prop[1] == "n" && theEventKey) {
            preRenderEventHelper(theEventKey, prop, vnode.props[prop]);
            continue;
        }
        else if (vnode.props[prop] === null) {
            continue;
        }
        else {
            $el.setAttribute(html5,vnode.props[prop]);
        }
        
    }
    
    if(null != vnode.children) {
        vnode.children.map(createElement)
            .forEach($el.appendChild.bind($el));
    }
    
    return $el;
}

function preRenderEventHelper(selector, eventType, callback, type="class") {
    
    domEvents[selector] = {eventType: eventType, callback: callback, type: type};
    
}


function postRenderEventHelper() {

    for (var selector in domEvents) {
        let obj = domEvents[selector];
        let eventType = obj.eventType;
        eventType = eventType.substring(2);
        let callback = obj.callback;
        let type = obj.type;
        selector = type == "class" ? ("." + selector) : ("#" + selector);
        let containers = document.querySelectorAll(selector);
        for (let i = 0; i < containers.length; i++) {
            containers[i].addEventListener(eventType, callback);
        }
    }
}

function resetDomEvents() {}



/**
 * Method for virtual nodes
 *
 * @see-also https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060
 */
function render($container, newNode) {
    let $containerClone = $container.cloneNode(false);
    let $parent = $container.parentNode;

    let $newNode = createElement(newNode);
    $containerClone.appendChild($newNode);

    $parent.replaceChild($containerClone, $container);
    postRenderEventHelper();
}




function updateElement($parent, newNode, oldNode, index = 0) {
    if (!oldNode) {
        $parent.appendChild(createElement(newNode));
    } else if (!newNode) {
        if (!$parent.childNodes[index]) {
            $parent.removeChild($parent.childNodes[$parent.childNodes.length-1]);
        } else {
            $parent.removeChild($parent.childNodes[index]);
        }
    } else if (changed(newNode, oldNode)) {
        $parent.replaceChild(
        createElement(newNode),
        $parent.childNodes[index]
        );
    } else if (newNode.type) {
        const newLength = newNode.children.length;
        const oldLength = oldNode.children.length;
        for (let i = 0; i < newLength || i < oldLength; i++) {
        
        updateElement(
            $parent.childNodes[index],
            newNode.children[i],
            oldNode.children[i],
            i
        );
        }
    }
    postRenderEventHelper();
}





function changed(node1, node2) {
    return typeof node1 !== typeof node2 ||
            typeof node1 === 'string' && node1 !== node2 ||
            node1.type !== node2.type ||
            propsChanged(node1, node2);
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
    
    

/**
 * Method to parse any XML-like string
 *
 * @see-also https://stackoverflow.com/questions/14340894/create-xml-in-javascript/34047092
 */

function parseComponent(tpl) {
    var container = "<html><head></head><body><div>"+tpl+"</div></body></html>";
    var parser = new DOMParser();
    var doc = parser.parseFromString(container,"text/html");
    // body.innerHTML = container;
    var body = doc.body;
    var first = body.firstChild;
    
    return first;
}


function tree(args){
    var strings = [];
    var root = arguments[0];
    var calc = [];
    for(var i = 1; i < arguments.length; i++){
        var currentBranch = i === 1 ? root : arguments[i-1];
        var arg = arguments[i];
        if("function" == typeof arg) {
            calc.push(arg[i](args[args.length-1]));
        } else if(arg instanceof Array) {
            currentBranch.children = arg;
        } else {
            currentBranch.children.push(arg);
        }
        
    }
    
    return root;
}




function DomTree(){
    var root = tree.apply(null,arguments);
    
    return createElement(root);
}



var nodeList = function(nodeName,items,cb) {
    var list = [];
    items.forEach( (item) => {
        var node, args, props;
        args = [nodeName];
        props = cb(item);
        for(var i = 0; i<props.length; i++){
            args.push(props[i]);
        }
        args.push(item.textContent);
        node = tag.apply(null,args);
        list.push(node);
    });
    
    return list;
};

    
function componentProps(){
    var props = {};
    for(var i = 0; i< arguments.length; i++){
        var arg = arguments[i];
        var prop = String.prototype.split.call(arg,"="); // key value pairs
        if(prop.length > 1) {
            props[prop[0]] = prop[1];
        } else {
            props[prop[0]] = null; // properties like selected, disabled, etc.
        }
    }
    
    return props;
}


function tag(){
    var nodeName, props, content;
    nodeName = Array.prototype.splice.call(arguments,0,1)[0];
    if(arguments.length > 1) {
        content = Array.prototype.splice.call(arguments,arguments.length-1)[0];
    }

    props = componentProps.apply(null,arguments);
    return vNode(nodeName,props,content);
}


function convert(elem){
    //const Node.ELEMENT_NODE;
    //const Node.TEXT_NODE;
    //const Node.DOCUMENT_NODE;
    //const Node.DOCUMENT_TYPE_NODE;
    //const Node.DOCUMENT_FRAGMENT_NODE;
    //const Node.COMMENT_NODE;
    //const Node.CDATA_SECTION_NODE;
    var vNode = {
        type: elem.nodeName.toLowerCase(),
        props: props(elem.attributes)
    };
    
    if(Node.TEXT_NODE == elem.nodeType) {
        return vNode;
    }
    
    else {
        vNode['children'] = [];
    }
    
    
    if(elem.childNodes && elem.childNodes.length > 0) {
        for(var i = 0; i < elem.childNodes.length; i++){
            vNode.children.push(convert(elem.childNodes.item(i)));
        }
    }
    
    return vNode;
}




function props(props){
    var p = {};
    for(var i = 0; i<props.length; i++){
        var attr = props.item(i);
        p["class" == attr.nodeName ? "className" : attr.nodeName] = attr.nodeValue;
        // console.log(props.item(i));
    }
    
    return p;
}




function loadTemplate(uri){
    return loadXml(uri)
    .then( function(doc) {
        return doc.body.innerHTML;
    })
}




// Main event handler for any view application.
function myAppEventHandler(e) {
    //console.log(e);

    let target, actions, action, virtualNodes, currentVnodeState, details;


    target = e.target;
    actions = getDefinedActions();
    details = e.frameworkDetail ? e.frameworkDetail : target.dataset;


    action = (target.dataset && target.dataset.action) ? target.dataset.action : e.action;

    if (!actions.includes(action)) {
        return false;
    }
    
    currentVnodeState = HISTORY.getRecent(0);

    virtualNodes = myEvents[action](details);
    
    virtualNodes.then(function(vNodes) {
        HISTORY.add(vNodes);
        updateElement(getMainContainer(), vNodes, currentVnodeState);
    });
    
    if(window){window.scrollTo(0, 0);}

    return false;
}




function getDefinedActions() {
    return Object.getOwnPropertyNames(myEvents);
}

function addEvent(key, result) {
    myEvents[key] = result;
}



function changeMainContainer(newElementId) {
    mainContainer = newElementId;
}

function getMainContainer() {
    return document.getElementById(mainContainer);
}



