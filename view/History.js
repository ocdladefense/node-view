// window.addEventListener('popstate', () => {
//     console.log('a');
// });

export default class History {
    static CACHE = {};

    static HISTORY = {};

    constructor() {
        const myEvents = {};

        const myAfterEvents = {};

        const domEvents = {};

        let vNodeHistory = [];

        let historyUserIndex = 0; //IW - to keep track of what part of the history the user is in, in case they want to go back or forward?

        //IW - to store stuff throughout the history so that you can access it at any point
        History.CACHE.set = function (key, value) {
            CACHE[key] = value;
        };

        History.CACHE.get = function (key) {
            return CACHE[key];
        };

        //IW - this one shouldnt be used because it would just replace the one at the index
        HISTORY.set = function (index, vNode) {
            vNodeHistory[index] = vNode;
        };

        //IW - The main function for adding things to the history
        HISTORY.add = function (newVnode) {
            vNodeHistory.push(newVnode);
        };

        //IW - if you dont want the user to be able to go back
        HISTORY.clear = function () {
            vNodeHistory = [];
        };

        //IW - if backwardsIndex is 0 it is the most recent history (the one already rendered)
        HISTORY.getRecent = function (backwardsIndex) {
            return vNodeHistory[vNodeHistory.length - (1 + backwardsIndex)];
        };

        //IW - the preveous function but it only returns the previous history
        HISTORY.getLast = function () {
            return vNodeHistory[vNodeHistory.length - 1];
        };

        //IW - Im not sure the use case for this one
        HISTORY.getLength = function () {
            return vNodeHistory.length;
        };
    }
}
function preRenderEventHelper(
    selector,
    eventType,
    callback,
    selectorType = 'class'
) {
    if (domEvents[selector] == null) {
        domEvents[selector] = {};
    }

    domEvents[selector][eventType.substring(2)] = {
        callback: callback,
        selectorType: selectorType
    };
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
            let domSelector =
                selectorType == 'class' ? '.' + selector : '#' + selector;
            let containers = document.querySelectorAll(domSelector);
            for (let i = 0; i < containers.length; i++) {
                containers[i].addEventListener(eventType, callback);
            }
        }
    }
}

//IW - might be left over from what view.js was before
function objectCombiner(obj1, obj2) {
    let newObj = {};
    for (let prop in obj1) {
        newObj[prop] = obj1[prop];
    }
    for (let prop in obj2) {
        newObj[prop] = obj2[prop];
    }

    return newObj;
}
