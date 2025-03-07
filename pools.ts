// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

import * as debug from './flags'
import { ICtor } from './helpers'
import { Entity, World } from './worlds'

export interface IPool {
    init(id: number, host: World): void
    itemType(): string
    id(): number
    world(): World
    has(entity: Entity): boolean
    del(entity: Entity): void
    addRaw(entity: Entity): void
    raw(entity: Entity): any
    setRaw(entity: Entity, dataRaw: any): void
    addBlocker(amount: number): void
    resize(cap: number): void
    len(): number
    entities(): Entity[]
    copy(srcEntity: Entity, dstEntity: Entity): any
}

export interface IAutoReset<T> {
    autoReset(c: T): void
}

export interface IAutoCopy<T> {
    autoCopy(src: T, dst: T): void
}

type AutoResetHandler<T> = (obj: T) => void
type AutoCopyHandler<T> = (src: T, dst: T) => void

export class Pool<T> implements IPool {
    private _id: number
    private _world!: World
    private _dense: Entity[]
    private _sparse!: number[]
    private _data: T[]
    private _len: number
    private _typeCtor: ICtor
    private _itemType: string
    private _autoResetHandler?: AutoResetHandler<T>
    private _autoCopyHandler?: AutoCopyHandler<T>
    private _default: T
    //#if DEBUG
    private _blockers!: number
    //#endif

    constructor(cType: ICtor, capacity: number = 0) {
        if (capacity <= 0) { capacity = 128 }
        this._id = -1
        this._dense = new Array<Entity>(capacity).fill(0 as Entity)
        this._data = new Array<T>(capacity)
        this._len = 0
        this._typeCtor = cType
        this._itemType = cType.name
        this._default = new cType()
        this._autoResetHandler = cType.prototype.autoReset
        this._autoCopyHandler = cType.prototype.autoCopy
        if (debug.isDebug()) {
            this._blockers = 0
        }
    }

    private static copyValues(dst: any, src: any) {
        for (let prop in src) {
            dst[prop] = src[prop]
        }
    }

    init(id: number, world: World) {
        if (debug.isDebug()) {
            if (this._world) { throw new Error(`пул компонентов "${this._itemType}" уже привязан к миру`) }
        }
        this._id = id
        this._world = world
        this._sparse = new Array<number>(this._world.entityGens().cap()).fill(0)
    }

    itemType(): string {
        return this._itemType
    }

    id(): number {
        return this._id
    }

    world(): World {
        return this._world
    }

    get(entity: Entity): T {
        if (debug.isDebug()) {
            if (entity < 0 || entity >= this._sparse.length || this._world.entityGens().get(entity) < 0) { throw new Error('не могу получить доступ к удаленной сущности') }
            if (this._sparse[entity] === 0) { throw new Error(`компонент "${this._itemType}" отсутствует на сущности`) }
        }
        return this._data[this._sparse[entity] - 1]
    }

    has(entity: Entity): boolean {
        if (debug.isDebug()) {
            if (entity < 0 || entity >= this._sparse.length || this._world.entityGens().get(entity) < 0) { throw new Error('не могу получить доступ к удаленной сущности') }
        }
        return this._sparse[entity] > 0
    }

    add(entity: Entity): T {
        if (debug.isDebug()) {
            if (entity < 0 || entity >= this._sparse.length || this._world.entityGens().get(entity) < 0) { throw new Error('не могу получить доступ к удаленной сущности') }
            if (this.has(entity)) { throw new Error('не могу добавить компонент, он уже существует') }
            if (this._blockers > 1) { throw new Error(`нельзя изменить пул компонентов "${this._itemType}", он находится в режиме "только чтение" из-за множественного доступа`) }
        }
        if (this._dense.length === this._len) {
            this._dense.length *= 2
            this._data.length *= 2
            this._dense.fill(0 as Entity, this._len, this._dense.length)
        }

        const idx = this._len
        this._len++
        this._dense[idx] = entity
        this._sparse[entity] = this._len

        if (!this._data[idx]) {
            this._data[idx] = new this._typeCtor()
        }

        if (this._autoResetHandler) {
            this._autoResetHandler(this._data[idx])
        }

        this._world.setEntityMaskBit(entity, this._id)

        return this._data[idx]
    }

    del(entity: Entity) {
        if (debug.isDebug()) {
            if (entity < 0 || entity >= this._sparse.length || this._world.entityGens().get(entity) < 0) { throw new Error('не могу получить доступ к удаленной сущности') }
            if (this._blockers > 1) { throw new Error(`нельзя изменить пул компонентов "${this._itemType}", он находится в режиме "только чтение" из-за множественного доступа`) }
        }
        const idx = this._sparse[entity] - 1
        if (idx >= 0) {
            this._sparse[entity] = 0
            this._len--

            if (this._autoResetHandler) {
                this._autoResetHandler(this._data[idx])
            } else {
                Pool.copyValues(this._data[idx], this._default)
            }

            if (idx < this._len) {
                this._dense[idx] = this._dense[this._len]
                this._sparse[this._dense[idx]] = idx + 1;
                [this._data[idx], this._data[this._len]] = [this._data[this._len], this._data[idx]]
            }

            this._world.unsetEntityMaskBit(entity, this._id)
        }
    }

    resize(cap: number) {
        const start = this._sparse.length
        this._sparse.length = cap
        this._sparse.fill(0, start, cap)
    }

    copy(srcEntity: Entity, dstEntity: Entity) {
        if (debug.isDebug()) {
            if (srcEntity < 0 || srcEntity >= this._sparse.length || this._world.entityGens().get(srcEntity) < 0) { throw new Error('не могу получить доступ к удаленной исходной сущности') }
            if (dstEntity < 0 || dstEntity >= this._sparse.length || this._world.entityGens().get(dstEntity) < 0) { throw new Error('не могу получить доступ к удаленной целевой сущности') }
            if (this._blockers > 1) { throw new Error(`нельзя изменить пул компонентов "${this._itemType}", он находится в режиме "только чтение" из-за множественного доступа`) }
        }
        if (this.has(srcEntity)) {
            const srcData = this.get(srcEntity)
            if (!this.has(dstEntity)) {
                this.add(dstEntity)
            }
            const dstData = this.get(dstEntity)
            if (this._autoCopyHandler) {
                this._autoCopyHandler(srcData, dstData)
            } else {
                Pool.copyValues(dstData, srcData)
            }
        }
    }

    len(): number {
        return this._len
    }

    entities(): Entity[] {
        return this._dense
    }

    data(): T[] {
        return this._data
    }

    addRaw(entity: Entity) {
        this.add(entity)
    }

    raw(entity: Entity): any {
        return this.get(entity)
    }

    setRaw(entity: Entity, dataRaw: any) {
        if (debug.isDebug()) {
            if (!dataRaw || dataRaw.constructor.name !== this._itemType) { throw new Error(`неправильные данные для использования в качестве компонента "${this._itemType}"`) }
        }
        Pool.copyValues(this.get(entity), dataRaw)
    }

    addBlocker(amount: number) {
        if (debug.isDebug()) {
            this._blockers += amount
            if (this._blockers < 0) { throw new Error('ошибочный баланс пользователей пула при попытке освобождения') }
        }
    }
}
