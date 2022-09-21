/**
 * @ocdladefense/view
 *
 * @description Here is my description.
 *
 *
 *
 */

 export { vNode, View };

 import { CACHE, HISTORY } from './cache.js';


/** 
 * @class View
 * 
 * This is a description of the View class.
 */
const View = (function() {

    
    const myEvents = {};

    const myAfterEvents = {};
    
    const domEvents = {};
    

    const CACHE = {};

    const HISTORY = {};
    
    let vNodeHistory = [];

    let historyUserIndex = 0; //IW - to keep track of what part of the history the user is in, in case they want to go back or forward?
    
    //IW - to store stuff throughout the history so that you can access it at any point
    CACHE.set = function (key, value) {
        CACHE[key] = value;
    }
    
    CACHE.get = function (key) {
        return CACHE[key];
    }

    //IW - this one shouldnt be used because it would just replace the one at the index
    HISTORY.set = function (index, vNode) {
        vNodeHistory[index] = vNode;
    }
    
    //IW - The main function for adding things to the history
    HISTORY.add = function (newVnode) {
        vNodeHistory.push(newVnode);
    };
    
    //IW - if you dont want the user to be able to go back
    HISTORY.clear = function () {
        vNodeHistory = [];
    }
    
    //IW - if backwardsIndex is 0 it is the most recent history (the one already rendered)
    HISTORY.getRecent = function (backwardsIndex) {
        return vNodeHistory[vNodeHistory.length - (1 + backwardsIndex)];
    }
    
    //IW - the preveous function but it only returns the previous history
    HISTORY.getLast = function () {
        return vNodeHistory[vNodeHistory.length - 1];
    }
    
    //IW - Im not sure the use case for this one
    HISTORY.getLength = function () {
        return vNodeHistory.length;
    }
    
    
    
    
    


    
    function preRenderEventHelper(selector, eventType, callback, selectorType="class") {
        if (domEvents[selector] == null) {
            domEvents[selector] = {};
        }

        domEvents[selector][eventType.substring(2)] = {callback: callback, selectorType: selectorType};
    }


    function getEvents() {
        return domEvents;
    }
    
    
    function postRenderEventHelper() {
    
        //IW - goes through all dom objects that have an even, then goes through each event for that object, like if it had an onclick and an onchange(, then adds it to all its children?)
        for (var selector in domEvents) {
            let eventsArray = domEvents[selector];
            for (var eventType in eventsArray) {
                let event = eventsArray[eventType];
            //eventsArray.forEach(event => {
                //let eventType = event.eventType;
                //eventType = eventType.substring(2);
                let callback = event.callback;
                let selectorType = event.selectorType;
                let domSelector = selectorType == "class" ? ("." + selector) : ("#" + selector);
                let containers = document.querySelectorAll(domSelector);
                for (let i = 0; i < containers.length; i++) {
                    containers[i].addEventListener(eventType, callback);
                }
            };
        }
    }
    
    
    
    
    //IW - might be left over from what view.js was before
    function objectCombiner(obj1, obj2) {
        let newObj = {};
        for (var prop in obj1) {
            newObj[prop] = obj1[prop];
        }
        for (var prop in obj2) {
            newObj[prop] = obj2[prop];
        }
    
        return newObj;
    }
    
    
    
    /**
     * @memberof View
     * @method render
     * @instance
     * @description Perform an initial paint of a virtual node structure.
     * @param {Object} vNode A virtual node structure.
     */
    function render(vNode) {
        let $clone = this.root.cloneNode(false);
        let $parent = this.root.parentNode;
        //let renderer = createElement.bind(this);
        let $newNode = this.createElement(vNode);
        $clone.appendChild($newNode);
    
        $parent.replaceChild($clone, this.root);
        // postRenderEventHelper(); //@jbernal

        this.root = $clone;
        this.root.addEventListener("click", myAppEventHandler);
        //BACKTO
        HISTORY.add($parent); //might not be the correct one to add, also might not be correct using add instead of starting new
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
        if (!oldNode) {
            $parent.appendChild(createElement(newNode));
        } else if (!newNode) {
            if (!$parent.childNodes[index]) {
                $parent.removeChild($parent.childNodes[$parent.childNodes.length-1]);
            } else {
                $parent.removeChild($parent.childNodes[index]);
            }
        } else if (changed(newNode, oldNode)) {
            //need a forth option for element changed then swap, or if just attributes changed then just swap those out
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
        //HISTORY.add($parent); //need it to be in an area where it will only get called once
        postRenderEventHelper();
    }
    
    /**
     * @memberof View
     * @method createElement
     * @description Recursively transform a virtual node structure into a DOM node tree.
     * @param {Object} vnode A virtual node structure.
     * @returns DOMElement
     */
    function createElement(vnode) {
        if(typeof vnode === "string") {
            return document.createTextNode(vnode);
        }
        if(vnode.type == "text") {
            return document.createTextNode(vnode.children);
        }
        //first check to see if component references a class name
        if(typeof vnode.type == "function" && vnode.type.prototype && vnode.type.prototype.render) {
            console.log("vNode is a class reference");
            let obj = new vnode.type(vnode.props);
            let node = this.createElement(obj.render());
            //BACKTO
            // Let the component know about its own root.
            obj.setRoot(node);
            return node;
        }
        if(typeof vnode.type == "function") {
            let fn = vnode.type(vnode.props);
            return this.createElement(fn);
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
        
        //BACKTO
        for(var prop in vnode.props) {
            var html5 = "className" == prop ? "class" : prop;
            if (prop[0] == "o" && prop[1] == "n" && theEventKey) {
                $el.addEventListener(prop.substring(2), vnode.props[prop]);
                //preRenderEventHelper(theEventKey, prop, vnode.props[prop]);
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
            vnode.children.map(this.createElement.bind(this))
                .forEach($el.appendChild.bind($el));
        }
        
        return $el;
    };
    
    
    
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
        
        

    
    
    
    //IW - not used?
    function props(props){
        var p = {};
        for(var i = 0; i<props.length; i++){
            var attr = props.item(i);
            p["class" == attr.nodeName ? "className" : attr.nodeName] = attr.nodeValue;
            // console.log(props.item(i));
        }
        
        return p;
    }
    

    
    
    // Main event handler for any view application.
    function myAppEventHandler(e) {
        //console.log(e);
        e.preventDefault(); //added to prevent a link from taking you somewhere
    
        let target, actions, action, virtualNodes, currentVnodeState, details;
    
    
        target = e.target;
        actions = getDefinedActions();
        details = e.frameworkDetail;
    
    
        action = details.action;
    
        if (!actions.includes(action)) {
            return false;
        }
        
        currentVnodeState = HISTORY.getRecent(0); //BACKTO
    
        virtualNodes = myEvents[action](details);
        
        if (virtualNodes) {
            try {
                //to remove error if a nonpromise is returned because you just want to detect if something is clicked without rendering anything
                //could maybe make it so other related errors dont pop up in debugger?
                return virtualNodes.then(function(vNodes) {
                    HISTORY.add(vNodes);
                    updateElement(root, vNodes, currentVnodeState);
                    myAfterEvents[action]();
                });
            }
            catch {
                //console.log("non promise event was called");
                return false;
            }
        }
    
    
    
    }
    
    
    
    
    function getDefinedActions() {
        return Object.getOwnPropertyNames(myEvents);
    }
    
    function addEvent(key, result, afterRenderEvent = function() {}) {
        //console.log(this.root); //using the root here might not work if it gets changed
        //this.root.addEventListener("click", myAppEventHandler);

        myEvents[key] = result;
        myAfterEvents[key] = afterRenderEvent;
    }

    

    /**
     * @constructs View
     * @param root
     */
    function View(root) {
        this.root = root;


        //document.getElementById("order-history-main").addEventListener("click", myAppEventHandler);
        //root.addEventListener("click", myAppEventHandler);
    }

    View.prototype = {
        render: render,
        addEvent: addEvent,
        preRenderEventHelper: preRenderEventHelper,
        createElement: createElement,
        getEvents, getEvents
    };
    

    return View;
})();



/**
 * Return a View instance from the given DOM element or selector.
 * 
 * @param {string} selector 
 * @returns {View}
 */
View.createRoot = function(selector) {
    let root = typeof selector == "string" ? document.querySelector(selector) : selector;
    return new View(root);
};
    


/**
 * @memberof View
 * @method createElement
 * @description Recursively transform a virtual node structure into a DOM node tree.
 * @param {Object} vnode A virtual node structure.
 * @returns DOMElement
 */
function createElement(vnode) {
    if(typeof vnode === "string") {
        return document.createTextNode(vnode);
    }
    if(vnode.type == "text") {
        return document.createTextNode(vnode.children);
    }
    //first check to see if component references a class name
    if(typeof vnode.type == "function" && vnode.type.prototype && vnode.type.prototype.render) {
        console.log("vNode is a class reference");
        let obj = new vnode.type(vnode.props);
        let node = createElement(obj.render());
        //BACKTO
        // Let the component know about its own root.
        obj.setRoot(node);
        return node;
    }
    if(typeof vnode.type == "function") {
        let fn = vnode.type(vnode.props);
        return createElement(fn);
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
    
    //BACKTO
    for(var prop in vnode.props) {
        var html5 = "className" == prop ? "class" : prop;
        
        if (prop[0] == "o" && prop[1] == "n" && theEventKey) {
            this.preRenderEventHelper(theEventKey, prop, vnode.props[prop]);
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
};

View.createElement = createElement;

/** 
 * JSX parsing function.
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