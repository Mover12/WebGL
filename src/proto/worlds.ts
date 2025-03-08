// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

import * as debug from './flags'
import { EntityMask_compatibleWith, EntityMask_compatibleWithAndWithout, EntityMask_getMinIndex, EntityMask_isEmpty, EntityMask_len, EntityMask_set, EntityMask_unset, Slice } from './helpers'
import { IPool } from './pools'

export type Entity = number & { __entityBrand: any }

export interface IEventListener {
    onEntityCreated(entity: Entity): void
    onEntityChanged(entity: Entity, poolId: number, added: boolean): void
    onEntityDestroyed(entity: Entity): void
    onWorldResized(capacity: number): void
    onWorldDestroyed(): void
}

export interface IAspect {
    init(world: World): void
    postInit(): void
}

export class WorldConfig {
    entities?: number
    recycledEntities?: number
    pools?: number
}

const DEF_CONFIG_ENTITIES: number = 256
const DEF_RECYCLED_ENTITIES: number = 256
const DEF_POOLS: number = 256

export class World {
    private _entityMasks: Slice<number>
    private _entityGens: Slice<number>
    private _recycled: Slice<Entity>
    private _aspects: Map<string, IAspect>
    private _pools: Slice<IPool>
    private _poolsMap: Map<string, IPool>
    private _copyBuf: Slice<number>
    private _destroyed: boolean
    private _entityMaskLen: number
    //#if DEBUG || LEOECSPROTO_WORLD_EVENTS
    private _listeners!: Slice<IEventListener>
    //#endif
    //#if DEBUG
    protected _inited!: boolean
    private _leaked!: Slice<Entity>
    static checkForLeakedEntities(host: World): boolean {
        if (host._leaked.len() > 0) {
            for (let i = 0, iMax = host._leaked.len(); i < iMax; i++) {
                const e = host._leaked.get(i)
                if (host._entityGens.get(e) > 0 && EntityMask_isEmpty(host._entityMasks, host._entityMaskLen, e)) {
                    return true
                }
            }
            host._leaked.clear(false)
        }
        return false
    }
    //#endif

    constructor(aspect: IAspect, cfg?: WorldConfig) {
        let capacity = cfg && cfg.entities ? cfg.entities : DEF_CONFIG_ENTITIES
        this._entityGens = new Slice<number>(capacity)
        capacity = cfg && cfg.recycledEntities ? cfg.recycledEntities : DEF_RECYCLED_ENTITIES
        this._recycled = new Slice<Entity>(capacity)
        this._aspects = new Map<string, IAspect>()
        capacity = cfg && cfg.pools ? cfg.pools : DEF_POOLS
        this._pools = new Slice<IPool>(capacity)
        this._poolsMap = new Map<string, IPool>()
        aspect.init(this)

        const poolsLen = this._pools.len()
        this._entityMaskLen = poolsLen >> 5
        if (poolsLen - (this._entityMaskLen << 5) != 0) {
            this._entityMaskLen++
        }
        this._entityMasks = new Slice<number>(this._entityGens.cap() * this._entityMaskLen)

        if (debug.isDebug() || debug.isWorldEvents()) {
            this._listeners = new Slice<IEventListener>(4)
        }
        if (debug.isDebug()) {
            if (this._aspects.size === 0) { throw new Error('нет зарегистрированных аспектов') }
            this._leaked = new Slice<Entity>(128)
            this._inited = true
        }
        aspect.postInit()
        this._copyBuf = new Slice<number>(this._entityMaskLen, true)
        this._destroyed = false
    }

    destroy() {
        if (debug.isDebug()) {
            if (this._destroyed) { throw new Error('мир уже не существует до вызова World.destroy()') }
            if (World.checkForLeakedEntities(this)) { throw new Error('обнаружена пустая сущность до вызова World.destroy()') }
        }
        this._destroyed = true
        for (let i = this._entityGens.len() - 1; i >= 0; i--) {
            if (this._entityGens.get(i) > 0) {
                this.delEntity(i as Entity)
            }
        }
        if (debug.isDebug() || debug.isWorldEvents()) {
            for (let ii = this._listeners.len() - 1; ii >= 0; ii--) {
                this._listeners.get(ii).onWorldDestroyed()
            }
        }
    }

    //#if DEBUG || LEOECSPROTO_WORLD_EVENTS
    addEventListener(el: IEventListener) {
        if (this._listeners) {
            this._listeners.add(el)
        }
    }

    removeEventListener(el: IEventListener) {
        if (this._listeners) {
            for (let i = 0, iMax = this._listeners.len(); i < iMax; i++) {
                if (this._listeners.get(i) === el) {
                    this._listeners.removeAt(i)
                    break
                }
            }
        }
    }
    //#endif

    isAlive(): boolean {
        return !this._destroyed
    }

    newEntity(): Entity {
        let entity: Entity
        if (this._recycled.len() > 0) {
            // есть сущности для переиспользования.
            entity = this._recycled.removeLast()
            this._entityGens.data()[entity] *= -1
        } else {
            // новая сущность.
            entity = this._entityGens.len() as Entity
            for (let i = 0; i < this._entityMaskLen; i++) {
                this._entityMasks.add(0)
            }
            const oldCap = this._entityGens.cap()
            this._entityGens.add(1)
            if (oldCap !== this._entityGens.cap()) {
                const cap = this._entityGens.cap()
                for (let i = 0, iMax = this._pools.len(); i < iMax; i++) {
                    this._pools.get(i).resize(cap)
                }
                if (debug.isDebug() || debug.isWorldEvents()) {
                    for (let ii = 0, iMax = this._listeners.len(); ii < iMax; ii++) {
                        this._listeners.get(ii).onWorldResized(cap)
                    }
                }
            }
        }
        if (debug.isDebug()) {
            this._leaked.add(entity)
        }
        if (debug.isDebug() || debug.isWorldEvents()) {
            for (let ii = 0, iMax = this._listeners.len(); ii < iMax; ii++) {
                this._listeners.get(ii).onEntityCreated(entity)
            }
        }
        return entity
    }

    delEntity(entity: Entity) {
        const gen = this._entityGens.get(entity)
        if (gen < 0) {
            return
        }
        let id = EntityMask_getMinIndex(this._entityMasks, this._entityMaskLen, entity)
        if (id >= 0) {
            while (id >= 0) {
                this._pools.get(id).del(entity)
                id = EntityMask_getMinIndex(this._entityMasks, this._entityMaskLen, entity)
            }
        } else {
            this._entityGens.data()[entity] = gen === 32767 ? -1 : -(gen + 1)
            this._recycled.add(entity)
            if (debug.isDebug() || debug.isWorldEvents()) {
                for (let ii = 0, iMax = this._listeners.len(); ii < iMax; ii++) {
                    this._listeners.get(ii).onEntityDestroyed(entity)
                }
            }
        }
    }

    copyEntity(srcEntity: Entity, dstEntity: Entity) {
        const copyBufData = this._copyBuf.data()
        const srcData = this._entityMasks.data()
        let srcOffset = srcEntity * this._entityMaskLen
        for (let i = 0; i < this._entityMaskLen; i++, srcOffset++) {
            copyBufData[i] = srcData[srcOffset]
        }
        const bufE = 0 as Entity
        let id = EntityMask_getMinIndex(this._copyBuf, this._entityMaskLen, bufE)
        while (id >= 0) {
            this._pools.get(id).copy(srcEntity, dstEntity)
            EntityMask_unset(this._copyBuf, this._entityMaskLen, bufE, id)
            id = EntityMask_getMinIndex(this._copyBuf, this._entityMaskLen, bufE)
        }
    }

    aspect(aType: string): IAspect {
        if (debug.isDebug()) {
            if (!this._aspects.has(aType)) { throw new Error(`не могу получить аспект "${aType}", его сперва надо зарегистрировать в мире`) }
        }
        return this._aspects.get(aType)!
    }

    aspects(): Map<string, IAspect> {
        return this._aspects
    }

    entityMasks(): Slice<number> {
        return this._entityMasks
    }

    entityGens(): Slice<number> {
        return this._entityGens
    }

    pools(): Slice<IPool> {
        return this._pools
    }

    componentsCount(entity: Entity): number {
        return EntityMask_len(this._entityMasks, this._entityMaskLen, entity)
    }

    entityMaskItemLen(): number {
        return this._entityMaskLen
    }

    entityMaskOffset(entity: Entity): number {
        return entity * this._entityMaskLen
    }

    setEntityMaskBit(entity: Entity, index: number) {
        EntityMask_set(this._entityMasks, this._entityMaskLen, entity, index)
        if (debug.isDebug() || debug.isWorldEvents()) {
            for (let i = 0, iMax = this._listeners.len(); i < iMax; i++) {
                this._listeners.get(i).onEntityChanged(entity, index, true)
            }
        }
    }

    unsetEntityMaskBit(entity: Entity, index: number) {
        EntityMask_unset(this._entityMasks, this._entityMaskLen, entity, index)
        if (debug.isDebug() || debug.isWorldEvents()) {
            for (let i = 0, iMax = this._listeners.len(); i < iMax; i++) {
                this._listeners.get(i).onEntityChanged(entity, index, false)
            }
        }
        if (EntityMask_isEmpty(this._entityMasks, this._entityMaskLen, entity)) {
            this.delEntity(entity)
        }
    }

    entityCompatibleWith(entity: Entity, inc: Slice<number>): boolean {
        return EntityMask_compatibleWith(this._entityMasks, this._entityMaskLen, entity, inc)
    }

    entityCompatibleWithAndWithout(entity: Entity, inc: Slice<number>, exc: Slice<number>): boolean {
        return EntityMask_compatibleWithAndWithout(this._entityMasks, this._entityMaskLen, entity, inc, exc)
    }

    addAspect(proto: IAspect) {
        if (debug.isDebug()) {
            if (this._inited) { throw new Error(`не могу добавить аспект "${proto.constructor.name}", мир уже инициализирован`) }
            if (this._aspects.has(proto.constructor.name)) { throw new Error(`не могу добавить аспект "${proto.constructor.name}", он уже существует`) }
        }
        this._aspects.set(proto.constructor.name, proto)
    }

    hasAspect(aType: string): boolean {
        return this._aspects.has(aType)
    }

    addPool(pool: IPool) {
        const cType = pool.itemType()
        if (debug.isDebug()) {
            if (this._inited) { throw new Error(`не могу добавить пул для компонента "${cType}", мир уже инициализирован`) }
            if (this._poolsMap.has(cType)) { throw new Error(`не могу добавить пул для компонента "${cType}", он уже существует`) }
        }
        pool.init(this._pools.len(), this)
        this._pools.add(pool)
        this._poolsMap.set(cType, pool)
    }

    pool(cType: string): IPool {
        if (debug.isDebug()) {
            if (!this._poolsMap.has(cType)) { throw new Error(`не могу получить пул для компонента "${cType}", его сперва надо зарегистрировать в аспекте`) }
        }
        return this._poolsMap.get(cType)!
    }

    hasPool(cType: string): boolean {
        return this._poolsMap.has(cType)
    }

    entityGen(entity: Entity): number {
        return this._entityGens.get(entity)
    }
}
