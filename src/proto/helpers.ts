// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

import * as debug from './flags'
import { Entity } from './worlds'

export interface ICtor {
    new(): any
}

export class Slice<T> {
    private _data: T[]
    private _len: number

    constructor(cap: number = 16, filled: boolean = false) {
        this._data = new Array<T>(cap)
        if (filled) {
            this._data.fill(0 as T)
        }
        this._len = filled ? cap : 0
    }

    data(): T[] {
        return this._data!
    }

    get(idx: number): T {
        return this._data[idx]
    }

    add(v: T) {
        if (this._data.length === this._len) {
            this._data.length *= 2
        }
        this._data[this._len++] = v
    }

    len(): number {
        return this._len
    }

    cap(): number {
        return this._data.length
    }

    removeLast(): T {
        if (debug.isDebug() && this._len === 0) { throw new Error('нет элементов для удаления') }
        this._len--
        return this._data[this._len]
    }

    removeAt(idx: number) {
        if (idx >= 0 && idx < this._len) {
            this._data[idx] = 0 as T
            this._len--
            if (idx < this._len) {
                [this._data[idx], this._data[this._len]] = [this._data[this._len], this._data[idx]]
            }
        }
    }

    clear(setDefaults: boolean = true) {
        if (setDefaults) {
            for (let i = 0; i < this._len; i++) {
                this._data[i] = 0 as T
            }
        }
        this._len = 0
    }
}

const BITS_LUT = [
    0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
    31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9,
]

export function EntityMask_set(data: Slice<number>, len: number, idx: Entity, index: number) {
    const div = index >> 5
    const rem = index - (div << 5)
    data.data()[idx * len + div] |= 1 << rem
}

export function EntityMask_unset(data: Slice<number>, len: number, idx: Entity, index: number) {
    const div = index >> 5
    const rem = index - (div << 5)
    data.data()[idx * len + div] &= ~(1 << rem)
}

export function EntityMask_has(data: Slice<number>, len: number, idx: Entity, index: number): boolean {
    const div = index >> 5
    const rem = index - (div << 5)
    return (data.data()[idx * len + div] & (1 << rem)) !== 0
}

export function EntityMask_isEmpty(data: Slice<number>, len: number, idx: Entity): boolean {
    for (let i = idx * len, iMax = (idx + 1) * len; i < iMax; i++) {
        if (data.data()[i] !== 0) {
            return false
        }
    }
    return true
}

export function EntityMask_len(data: Slice<number>, len: number, idx: Entity): number {
    let count = 0
    let offset = idx * len
    for (let i = 0; i < len; i++, offset++) {
        let v = data.data()[offset]
        v -= (v >> 1) & 0x55555555
        v = (v & 0x33333333) + ((v >> 2) & 0x33333333)
        count += (((v + (v >> 4)) & 0xF0F0F0F) * 0x1010101) >> 24
    }
    return count
}

export function EntityMask_getMinIndex(data: Slice<number>, len: number, idx: Entity): number {
    let offset = idx * len
    for (let i = 0; i < len; i++, offset++) {
        const v = data.data()[offset]
        if (v !== 0) {
            return (i << 5) + BITS_LUT[((v & -v) * 0x077CB531) >> 27]
        }
    }
    return -1
}

export function EntityMask_compatibleWith(data: Slice<number>, len: number, idx: Entity, inc: Slice<number>): boolean {
    let offset = idx * len
    for (let i = 0; i < len; i++, offset++) {
        const rhs = inc.data()[i]
        if ((data.data()[offset] & rhs) !== rhs) {
            return false
        }
    }
    return true
}

export function EntityMask_compatibleWithAndWithout(data: Slice<number>, len: number, idx: Entity, inc: Slice<number>, exc: Slice<number>): boolean {
    let offset = idx * len
    for (let i = 0; i < len; i++, offset++) {
        const lhs = data.data()[offset]
        const rhs = inc.data()[i]
        if ((lhs & rhs) !== rhs || (lhs & exc.data()[i]) !== 0) {
            return false
        }
    }
    return true
}
