
export { CACHE, HISTORY, vNodeHistory };



const CACHE = {};

CACHE.set = function (key, value) {
    CACHE[key] = value;
}

CACHE.get = function (key) {
    return CACHE[key];
}


const HISTORY = {};
let vNodeHistory = [];

HISTORY.set = function (index, vNode) {
    vNodeHistory[index] = vNode;
}

HISTORY.add = function (newVnode) {
    vNodeHistory.push(newVnode);
};

HISTORY.clear = function () {
    vNodeHistory = [];
}

HISTORY.getRecent = function (backwardsIndex) {
    return vNodeHistory[vNodeHistory.length - (1 + backwardsIndex)];
}

HISTORY.getLast = function () {
    return vNodeHistory[vNodeHistory.length - 1];
}

HISTORY.getLength = function () {
    return vNodeHistory.length;
}











