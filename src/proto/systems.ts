// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒
// Коммерческая лицензия подписчика
// (c) 2023 Leopotam <leopotam@yandex.ru>
// –‒‒‒‒––‒–––––––––‒–‒‒–––––‒–‒––‒‒––‒––‒‒

import * as debug from './flags'
import { Slice } from './helpers'
import { IAspect, World } from './worlds'

export interface ISystem { }

export interface IPreInitSystem extends ISystem {
    preInit(systems: ISystems): void
}

export interface IInitSystem extends ISystem {
    init(systems: ISystems): void
}

export interface IRunSystem extends ISystem {
    run(): void
}

export interface IPostRunSystem extends ISystem {
    postRun(): void
}

export interface IDestroySystem extends ISystem {
    destroy(): void
}

export interface IPostDestroySystem extends ISystem {
    postDestroy(): void
}

export interface IModule {
    init(systems: ISystems): void
    aspects(): IAspect[]
    modules(): IModule[]
}

export interface ISystems {
    addSystem(system: ISystem, pointName?: string): ISystems
    addService(injectInstance: any, asType?: string): ISystems
    addModule(module: IModule): ISystems
    addPoint(pointName: string): ISystems
    addWorld(world: World, name: string): ISystems
    world(worldName?: string): World
    namedWorlds(): Map<string, World>
    services(): Map<string, any>
    systems(): Slice<ISystem>
    init(): void
    run(): void
    destroy(): void
}

export enum BenchType {
    PreInit = 0,
    Init = 1,
    Run = 2,
    PostRun = 3,
    Destroy = 4,
    PostDestroy = 5
}

export class Systems implements ISystems {
    protected static _pointNameDefault: string = '<default>'
    protected _defaultWorld: World
    protected _worldMap: Map<string, World>
    protected _allSystems: Slice<ISystem>
    protected _runSystems: Slice<IRunSystem>
    protected _postrunSystems: Slice<IPostRunSystem>
    protected _deferredSystems: Map<string, Slice<ISystem>>
    protected _services: Map<string, any>
    protected _inited: boolean
    private _defaultPointAdded: boolean
    //#if DEBUG || LEOECSPROTO_SYSTEM_BENCHES
    private _benches!: Slice<number[]>
    private _runSystemIndices!: Slice<number>
    private _postRunSystemIndices!: Slice<number>
    private _benchStart!: number
    private _benchStop!: number

    bench(idx: number, sType: BenchType): number {
        if (debug.isDebug() || debug.isSystemBenches()) {
            return this._benches.get(idx)[sType]
        }
        return 0
    }
    //#endif

    constructor(defaultWorld: World) {
        this._defaultWorld = defaultWorld
        this._worldMap = new Map<string, World>()
        this._allSystems = new Slice<ISystem>(64)
        this._runSystems = new Slice<IRunSystem>(64)
        this._postrunSystems = new Slice<IPostRunSystem>(64)
        this._deferredSystems = new Map<string, Slice<ISystem>>()
        this._services = new Map<string, object>()
        if (debug.isDebug() || debug.isSystemBenches()) {
            this._benches = new Slice<number[]>(64)
            this._runSystemIndices = new Slice<number>(64)
            this._postRunSystemIndices = new Slice<number>(64)
            this._benchStart = 0
            this._benchStop = 0
        }
        this._defaultPointAdded = false
        this._inited = false
    }

    addSystem(system: ISystem, pointName?: string): ISystems {
        if (debug.isDebug()) {
            if (this.isInited()) { throw new Error(`не могу добавить систему "${system.constructor.name}", системы уже инициализированы`) }
        }
        if (!pointName) { pointName = Systems._pointNameDefault }
        let list = this._deferredSystems.get(pointName)
        if (!list) {
            list = new Slice<ISystem>(8)
            this._deferredSystems.set(pointName, list)
        }
        list.add(system)
        return this
    }

    addService(injectInstance: any, asType?: string): ISystems {
        const type: string = asType ? asType : injectInstance.constructor.name
        if (debug.isDebug()) {
            if (this.isInited()) {
                throw new Error(`не могу добавить инъекцию с типом "${type}", системы уже инициализированы`)
            }
            if (this._services.has(type)) { throw new Error(`не могу добавить сервис с типом "${type}", такой тип уже существует`) }
        }
        this._services.set(type, injectInstance)
        return this
    }

    addModule(module: IModule): ISystems {
        if (debug.isDebug()) {
            if (this.isInited()) { throw new Error(`не могу добавить модуль "${module.constructor.name}", системы уже инициализированы`) }
            if (this._defaultPointAdded) { throw new Error(`не могу добавить модуль "${module.constructor.name}", он должен быть зарегистрирован до первого вызова addPoint()`) }
        }
        module.init(this)
        return this
    }

    addPoint(pointName: string): ISystems {
        if (debug.isDebug()) {
            if (this.isInited()) { throw new Error(`не могу добавить точку "${pointName}", системы уже инициализированы`) }
            if (pointName.length === 0) { throw new Error('не могу добавить точку без имени') }
        }
        if (!this._defaultPointAdded) {
            // системы без явной привязки к точкам должны быть добавлены перед всеми точками.
            this._defaultPointAdded = true
            const defList = this._deferredSystems.get(Systems._pointNameDefault)
            if (defList) {
                this.addDeferredSystems(defList)
                this._deferredSystems.delete(Systems._pointNameDefault)
            }
        }
        const list = this._deferredSystems.get(pointName)
        if (list) {
            this.addDeferredSystems(list)
            this._deferredSystems.delete(pointName)
        }
        return this
    }

    addWorld(world: World, name: string): ISystems {
        if (debug.isDebug()) {
            if (this.isInited()) { throw new Error(`не могу добавить мир с именем "${name}", системы уже инициализированы`) }
            if (name.length === 0) { throw new Error('не могу добавить мир с пустым именем') }
            if (this._worldMap.has(name)) { throw new Error(`не могу добавить мир с именем "${name}", имя уже существует`) }
        }
        this._worldMap.set(name, world)
        return this
    }

    world(worldName?: string): World {
        if (!worldName) {
            return this._defaultWorld
        }
        if (debug.isDebug()) {
            if (!this._worldMap.has(worldName)) { throw new Error(`не могу найти мир с именем "${worldName}", его сперва надо зарегистрировать в системах`) }
        }
        return this._worldMap.get(worldName)!
    }

    namedWorlds(): Map<string, World> {
        return this._worldMap
    }

    services(): Map<string, object> {
        return this._services
    }

    systems(): Slice<ISystem> {
        return this._allSystems
    }

    init() {
        // добавляем системы без привязки, если они не были добавлены.
        this.addPoint(Systems._pointNameDefault)
        if (debug.isDebug()) {
            for (const key in this._deferredSystems) {
                throw new Error(`требуемая точка привязки "${key}" не найдена`)
            }
        }
        for (let i = 0, iMax = this._allSystems.len(); i < iMax; i++) {
            const anySystem = <any>this._allSystems.get(i)
            if (debug.isDebug() || debug.isSystemBenches()) {
                const benchesItem = new Array<number>(BenchType.PostDestroy + 1).fill(-100)
                this._benches.add(benchesItem)
                if (anySystem.run) {
                    this._runSystemIndices.add(i)
                }
                if (anySystem.postRun) {
                    this._postRunSystemIndices.add(i)
                }
            }
            if (anySystem.preInit) {
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStart = performance.now()
                }
                (<IPreInitSystem>anySystem).preInit(this)
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStop = performance.now()
                    this._benches.get(i)[BenchType.PreInit] = Math.floor((this._benchStop - this._benchStart) * 100)
                }
                if (debug.isDebug()) {
                    const worldName = Systems.checkForLeakedEntities(this)
                    if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${anySystem.constructor.name}.preInit()`) }
                }
            }
        }
        for (let i = 0, iMax = this._allSystems.len(); i < iMax; i++) {
            const anySystem = <any>this._allSystems.get(i)
            if (anySystem.init) {
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStart = performance.now()
                }
                (<IInitSystem>anySystem).init(this)
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStop = performance.now()
                    this._benches.get(i)[BenchType.Init] = Math.floor((this._benchStop - this._benchStart) * 100)
                }
                if (debug.isDebug()) {
                    const worldName = Systems.checkForLeakedEntities(this)
                    if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${anySystem.constructor.name}.init()`) }
                }
            }
        }
    }

    run() {
        for (let i = 0, iMax = this._runSystems.len(); i < iMax; i++) {
            if (debug.isDebug() || debug.isSystemBenches()) {
                this._benchStart = performance.now()
            }
            this._runSystems.get(i).run()
            if (debug.isDebug() || debug.isSystemBenches()) {
                this._benchStop = performance.now()
                this._benches.get(i)[BenchType.Run] = Math.floor((this._benchStop - this._benchStart) * 100)
            }
            if (debug.isDebug()) {
                const worldName = Systems.checkForLeakedEntities(this)
                if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${this._runSystems.get(i).constructor.name}.run()`) }
            }
        }
        for (let i = 0, iMax = this._postrunSystems.len(); i < iMax; i++) {
            if (debug.isDebug() || debug.isSystemBenches()) {
                this._benchStart = performance.now()
            }
            this._postrunSystems.get(i).postRun()
            if (debug.isDebug() || debug.isSystemBenches()) {
                this._benchStop = performance.now()
                this._benches.get(i)[BenchType.PostRun] = Math.floor((this._benchStop - this._benchStart) * 100)
            }
            if (debug.isDebug()) {
                const worldName = Systems.checkForLeakedEntities(this)
                if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${this._postrunSystems.get(i).constructor.name}.postRun()`) }
            }
        }
    }

    destroy() {
        for (let i = 0, iMax = this._allSystems.len(); i < iMax; i++) {
            const anySystem = <any>this._allSystems.get(i)
            if (anySystem.destroy) {
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStart = performance.now()
                }
                (<IDestroySystem>anySystem).destroy()
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStop = performance.now()
                    this._benches.get(i)[BenchType.Destroy] = Math.floor((this._benchStop - this._benchStart) * 100)
                }
                if (debug.isDebug()) {
                    const worldName = Systems.checkForLeakedEntities(this)
                    if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${anySystem.constructor.name}.destroy()`) }
                }
            }
        }
        for (let i = 0, iMax = this._allSystems.len(); i < iMax; i++) {
            const anySystem = <any>this._allSystems.get(i)
            if (anySystem.postDestroy) {
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStart = performance.now()
                }
                (<IPostDestroySystem>anySystem).postDestroy()
                if (debug.isDebug() || debug.isSystemBenches()) {
                    this._benchStop = performance.now()
                    this._benches.get(i)[BenchType.PostDestroy] = Math.floor((this._benchStop - this._benchStart) * 100)
                }
                if (debug.isDebug()) {
                    const worldName = Systems.checkForLeakedEntities(this)
                    if (worldName) { throw new Error(`обнаружена пустая сущность в мире "${worldName}" после вызова ${anySystem.constructor.name}.postDestroy()`) }
                }
            }
        }
    }

    isInited(): boolean {
        return this._inited
    }

    static checkForLeakedEntities(systems: ISystems): string {
        if (World.checkForLeakedEntities(systems.world())) { return 'по умолчанию' }
        const namedWorlds = systems.namedWorlds()
        for (const key in namedWorlds) {
            if (World.checkForLeakedEntities(namedWorlds.get(key)!)) {
                return key
            }
        }
        return ''
    }

    private addDeferredSystems(list: Slice<ISystem>) {
        for (let i = 0; i < list.len(); i++) {
            const anySystem = <any>list.get(i)
            this._allSystems.add(anySystem)
            if (anySystem.run) {
                this._runSystems.add(<IRunSystem>anySystem)
            }
            if (anySystem.postRun) {
                this._postrunSystems.add(<IPostRunSystem>anySystem)
            }
        }
    }
}
