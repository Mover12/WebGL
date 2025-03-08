// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

import * as debug from './flags'
import { Slice, ICtor, EntityMask_set } from './helpers'
import { IPool } from './pools'
import { Entity, World } from './worlds'

export interface IIt {
    init(world: World): IIt
    world(): World
    has(entity: Entity): boolean
    begin(): void
    next(): boolean
    end(): void
    entity(): Entity
}

export class It implements IIt {
    private _world!: World
    private _iTypes: ICtor[]
    private _incPools!: IPool[]
    private _incMask!: Slice<number>
    private _entities?: Entity[]
    private _id!: number
    private _currEntity!: Entity
    private _lastMinPool!: IPool
    //#if DEBUG
    private _blocked!: boolean
    private _inited!: boolean
    //#endif

    constructor(iTypes: ICtor[]) {
        if (debug.isDebug()) {
            if (!iTypes || iTypes.length < 1) { throw new Error('некорректный список include-пулов для инициализации итератора') }
        }
        this._iTypes = iTypes
    }

    init(world: World): IIt {
        this._world = world
        const maskLen = world.entityMaskItemLen()
        this._incMask = new Slice<number>(maskLen, true)
        this._incPools = new Array<IPool>(this._iTypes.length)
        const maskE = 0 as Entity
        for (let i = 0; i < this._iTypes.length; i++) {
            const pool = this._world.pool(this._iTypes[i].name)
            EntityMask_set(this._incMask, maskLen, maskE, pool.id())
            this._incPools[i] = pool
        }
        if (debug.isDebug()) {
            this._blocked = false
            this._inited = true
        }
        return this
    }

    includes(): IPool[] {
        return this._incPools
    }

    world(): World {
        return this._world
    }

    has(entity: Entity): boolean {
        return this._world.entityGens().get(entity) > 0 && this._world.entityCompatibleWith(entity, this._incMask)
    }

    //#if DEBUG
    addBlocker(amount: number) {
        for (let i = 0; i < this._incPools.length; i++) {
            this._incPools[i].addBlocker(amount)
        }
    }
    //#endif

    begin() {
        if (debug.isDebug()) {
            if (!this._inited) { throw new Error('итератор не инициализирован') }
            if (this._entities || this._blocked) { throw new Error('итератор не был корректно закрыт в прошлый раз') }
            // блокировка пула для проверки на множественный доступ.
            this.addBlocker(1)
            this._blocked = true
        }
        let minPool = this._incPools[0]
        let minVal = minPool.len()
        for (let i = 1; i < this._incPools.length; i++) {
            const p = this._incPools[i]
            const v = p.len()
            if (v < minVal) {
                minVal = v
                minPool = p
            }
        }
        this._entities = minPool.entities()
        this._id = minVal
        this._lastMinPool = minPool
    }

    next(): boolean {
        while (true) {
            if (this._id == 0) {
                this.end()
                return false
            }
            this._id--
            this._currEntity = this._entities![this._id]
            if (this._world.entityCompatibleWith(this._currEntity, this._incMask)) {
                return true
            }
        }
    }

    end() {
        this._entities = undefined
        if (debug.isDebug()) {
            if (this._blocked) {
                // разблокировка пула для проверки на множественный доступ.
                this.addBlocker(-1)
                this._blocked = false
            }
        }
    }

    entity(): Entity {
        return this._currEntity
    }

    minPool(): IPool {
        return this._lastMinPool
    }

    incMask(): Slice<number> {
        return this._incMask
    }
}

export class ItExc implements IIt {
    private _world!: World
    private _iTypes: ICtor[]
    private _incPools!: IPool[]
    private _incMask!: Slice<number>
    private _eTypes: ICtor[]
    private _excPools!: IPool[]
    private _excMask!: Slice<number>
    private _entities?: Entity[]
    private _id!: number
    private _currEntity!: Entity
    private _lastMinPool!: IPool
    //#if DEBUG
    private _blocked!: boolean
    private _inited!: boolean
    //#endif

    constructor(iTypes: ICtor[], eTypes: ICtor[]) {
        if (debug.isDebug()) {
            if (!iTypes || iTypes.length < 1) { throw new Error('некорректный список include-пулов для инициализации итератора') }
            if (!eTypes || eTypes.length < 1) { throw new Error('некорректный список exclude-пулов для инициализации итератора') }
        }
        this._iTypes = iTypes
        this._eTypes = eTypes
    }

    init(world: World): IIt {
        this._world = world
        const maskLen = world.entityMaskItemLen()
        this._incMask = new Slice<number>(maskLen, true)
        this._incPools = new Array<IPool>(this._iTypes.length)
        const maskE = 0 as Entity
        for (let i = 0; i < this._iTypes.length; i++) {
            const pool = this._world.pool(this._iTypes[i].name)
            EntityMask_set(this._incMask, maskLen, maskE, pool.id())
            this._incPools[i] = pool
        }
        this._excMask = new Slice<number>(maskLen, true)
        this._excPools = new Array<IPool>(this._eTypes.length)
        for (let i = 0; i < this._eTypes.length; i++) {
            const pool = world.pool(this._eTypes[i].name)
            EntityMask_set(this._excMask, maskLen, maskE, pool.id())
            this._excPools[i] = pool
        }
        if (debug.isDebug()) {
            this._blocked = false
            this._inited = true
        }
        return this
    }

    includes(): IPool[] {
        return this._incPools
    }

    world(): World {
        return this._world
    }

    excludes(): IPool[] {
        return this._excPools
    }

    has(entity: Entity): boolean {
        return this._world.entityGens().get(entity) > 0 && this._world.entityCompatibleWithAndWithout(entity, this._incMask, this._excMask)
    }

    //#if DEBUG
    addBlocker(amount: number) {
        for (let i = 0; i < this._incPools.length; i++) {
            this._incPools[i].addBlocker(amount)
        }
    }
    //#endif

    begin() {
        if (debug.isDebug()) {
            if (!this._inited) { throw new Error('итератор не инициализирован') }
            if (this._entities || this._blocked) { throw new Error('итератор не был корректно закрыт в прошлый раз') }
            // блокировка пула для проверки на множественный доступ.
            this.addBlocker(1)
            this._blocked = true
        }
        let minPool = this._incPools[0]
        let minVal = minPool.len()
        for (let i = 1; i < this._incPools.length; i++) {
            const p = this._incPools[i]
            const v = p.len()
            if (v < minVal) {
                minVal = v
                minPool = p
            }
        }
        this._entities = minPool.entities()
        this._id = minVal
        this._lastMinPool = minPool
    }

    next(): boolean {
        while (true) {
            if (this._id == 0) {
                this.end()
                return false
            }
            this._id--
            this._currEntity = this._entities![this._id]
            if (this._world.entityCompatibleWithAndWithout(this._currEntity, this._incMask, this._excMask)) {
                return true
            }
        }
    }

    end() {
        this._entities = undefined
        if (debug.isDebug()) {
            if (this._blocked) {
                // разблокировка пула для проверки на множественный доступ.
                this.addBlocker(-1)
                this._blocked = false
            }
        }
    }

    entity(): Entity {
        return this._currEntity
    }

    minPool(): IPool {
        return this._lastMinPool
    }

    incMask(): Slice<number> {
        return this._incMask
    }

    excMask(): Slice<number> {
        return this._excMask
    }
}
