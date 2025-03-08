// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

let isDebugFlag: boolean = false
let isWorldEventsFlag: boolean = false
let isSystemBenchesFlag: boolean = false

export function isDebug() {
    return isDebugFlag
}

export function setDebug() {
    isDebugFlag = true
}

export function isWorldEvents() {
    return isWorldEventsFlag
}

export function setWorldEvents() {
    isWorldEventsFlag = true
}

export function isSystemBenches() {
    return isSystemBenchesFlag
}

export function setSystemBenches() {
    isSystemBenchesFlag = true
}
