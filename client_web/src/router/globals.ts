export let cache = new Map();

export function clearCache(type: string) {
    if (type == "@all") cache = new Map();
    else cache.delete(type);
}

export function fetchData(type: string) {
    if (!cache.has(type) || !cache.get(type)) {
        if (type.includes("@async")) cache.set(type, initDataAsync(type));
        else cache.set(type, initData(type));
    }

    console.log(type, cache.get(type));
    return cache.get(type);
}

export function setData(type: string, data: unknown) {
    if (data == undefined) cache.delete(type);
    cache.set(type, data);
}

async function initDataAsync(type: string) {
    throw Error("Not implemented yet: " + type);
}

function initData(type: string) {
    if (type === "isLoggedIn") return false;
    if (type === "loginUsername") return "";
    throw Error("Not implemented yet: " + type);
}

export function useWrapPromise(promise: { status: string; value: any; reason: any; then: (arg0: (result: any) => void, arg1: (reason: any) => void) => void; }) {
    if (promise.status === 'fulfilled') {
        return promise.value;
    } else if (promise.status === 'rejected') {
        throw promise.reason;
    } else if (promise.status === 'pending') {
        throw promise;
    } else {
        promise.status = 'pending';
        promise.then(
            result => {
                promise.status = 'fulfilled';
                promise.value = result;
            },
            reason => {
                promise.status = 'rejected';
                promise.reason = reason;
            },
        );
        throw promise;
    }
}

export function randomUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
            v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

export function getProperty(obj: unknown, key: string) {
    if (typeof obj === "object" && obj !== null) {
        return (obj as { [k: string]: unknown })[key];
    } else {
        return undefined;
    }
}