let renderCount = 0;

let states = {};

// Index of the current hook being executed.
let hookIndex = 0;

export { renderCount, states, hookIndex };

export function incrementRenderCount() {
    renderCount++;
}

// Store values related to all hooks in the order they are executed.
export const hooks = [];

// Store effects in with the same indices as their dependencies
// registered in hooks.
export const effects = [];


export function resetHookIndex(start = 0) {
    hookIndex = start;
}




// Version 3.0.
export function useState(initialValue) {
    // console.log("useState called.",idx);
    const state = hooks[hookIndex] || initialValue;

    const _idx = hookIndex;
    const setState = (newVal) => {
        hooks[_idx] = newVal;
    };

    hookIndex++;
    return [state, setState];
}



// Version 3.0.
export function useEffect(cb, deps) {
    console.log("UseEffect called.", hookIndex);
    effects[hookIndex] = cb;
    hooks[hookIndex] = deps;

    hookIndex++;
}


// Version 3.0.
export function getEvaluator(oldHooks) {

    return function evaluateEffect(fn, index) {


        let result = null;
        let oldDeps = oldHooks[index]; // This will always be null on the first pass.
        let deps = hooks[index];
        let execute = false;

        console.log("Evaluating effect at index", index);
        console.log(index, oldDeps, deps);

        // No previous dependency was recorded.
        // This should mean we have only completed the first render.
        // I.e., renderIndex === 0;
        if (!oldDeps)
        { // Everything gets executed at least once.
            execute = true;
        }
        else if (deps == [])
        { // Per docs, empty deps gets executed once.
            execute = false;
        }
        else if (null == deps)
        { // Per docs, null deps gets executed with each render.
            execute = true;
        }
        else if (Array.isArray(deps))
        {
            execute = deps.some((dep, i) => !Object.is(dep, oldDeps[i]));
        }


        // TODO: if result is a function, React interprets this as being a "cleanup" function.
        // For example, if useEffect connects to a database, result could be a function that disconnects from the database.
        if (execute)
        {
            result = Promise.resolve(fn());
            console.log("UseEffect callback was executed.", index);
            if (typeof result == 'function')
            {
                // result(deps);
            }
        }
    };
}

