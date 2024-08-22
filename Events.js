function addEvent(key, result, afterRenderEvent = function () {}) {
    //console.log(this.root); //using the root here might not work if it gets changed
    //this.root.addEventListener("click", myAppEventHandler);

    myEvents[key] = result;
    myAfterEvents[key] = afterRenderEvent;
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
            return virtualNodes.then(function (vNodes) {
                HISTORY.add(vNodes);
                updateElement(root, vNodes, currentVnodeState);
                myAfterEvents[action]();
            });
        } catch {
            //console.log("non promise event was called");
            return false;
        }
    }
}
