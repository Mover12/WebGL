<p align="center">
    <img src="./logo.png" alt="Logo">
</p>

# LeoEcs Proto - Легковесный TypeScript Entity Component System фреймворк
Производительность, минимизация использования памяти, отсутствие зависимостей от любого игрового движка - это основные цели данного фреймворка.

> **ВАЖНО!** Не забывайте включать `DEBUG`-режим - по умолчанию используется `RELEASE`-режим без дополнительных проверок:
> ```ts
> import * as proto from './leopotam.ecsproto/proto'
> proto.setDebug()
> ```

> **ВАЖНО!** Требует TypeScript >=4.1.0.


# Социальные ресурсы
[Официальный блог](https://leopotam.com)


# Установка


## В виде исходников
Поддерживается установка в виде исходников из архива, который надо распаковать в проект.


## Прочие источники
Официальные версии выпускаются для активных подписчиков в виде ссылок на актуальные версии.


# Основные типы


## Сущность
Сама по себе ничего не значит и является исключительно идентификатором для для набора компонентов. Реализована как `Entity`:
```ts
// Создаем новую сущность в мире.
const entity: proto.Entity = world.newEntity()

// Любая сущность может быть удалена, при этом сначала все компоненты
// будут автоматически удалены и только потом сущность будет считаться уничтоженной.
world.delEntity(entity)

// Компоненты с любой активной сущности могут быть скопированы на другую существующую.
world.copyEntity(srcEntity, dstEntity)
```

> **ВАЖНО!** На сущности может существовать только один экземпляр каждого типа компонента.

> **ВАЖНО!** Сущности не могут существовать без компонентов и будут автоматически уничтожаться при удалении последнего компонента на них.

> **ВАЖНО!** Тип `Entity` не является ссылочным, экземпляры этого типа нельзя сохранять за пределами текущего метода. Если требуется сохранение, то следует сохранять пару `Entity`-сущность и ее поколение, полученное через вызов `World.entityGen()`. В `QoL`-расширении есть готовая реализация в виде `PackedEntity`.

## Компонент
Является контейнером для данных пользователя и не должен содержать логику (допускается минимальная вспомогательная обвязка, но не куски основной логики):
```ts
class Component1 {
    id: number
    name: string
}
class Component2 {
    // Компоненты могут быть пустыми и использоваться как маркеры для фильтрации.
}
```
Компоненты могут быть добавлены, запрошены или удалены через компонентные пулы.


## Система
Является контейнером для основной логики для обработки отфильтрованных сущностей.
Существует в виде пользовательского класса, реализующего как минимум один из интерфейсов:
```ts
import * as proto from './leopotam.ecsproto/proto'
class UserSystem implements
    proto.IPreInitSystem, proto.IInitSystem,
    proto.IRunSystem, proto.IPostRunSystem,
    proto.IDestroySystem, proto.IPostDestroySystem {

    preInit(systems: proto.ISystems) {
        // Будет вызван один раз в момент работы ISystems.init() и до срабатывания IInitSystem.init().
        // Не рекомендуется к использованию, предназначен для интеграции расширений!
    }

    init(systems: proto.ISystems) {
        // Будет вызван один раз в момент работы ISystems.init() и после срабатывания IPreInitSystem.preInit().
    }

    run() {
        // Будет вызван один раз в момент работы ISystems.run().
    }

    postRun() {
        // Будет вызван один раз в момент работы ISystems.run() и после срабатывания IRunSystem.run().
    }

    destroy() {
        // Будет вызван один раз в момент работы ISystems.destroy() и до срабатывания IPostDestroySystem.postDestroy().
    }

    postDestroy() {
        // Будет вызван один раз в момент работы ISystems.destroy() и после срабатывания IDestroySystem.destroy().
        // Не рекомендуется к использованию, предназначен для интеграции расширений!
    }
}
```


# Сервисы
Экземпляр любого пользовательского типа (класса) может быть одновременно подключен ко всем системам:
```ts
import * as proto from './leopotam.ecsproto/proto'
class PathService {
    prefabsPath: string

    constructor(prefabs: string) {
        this.prefabsPath = prefabs
    }
}
class SettingsService {
    spawnPoint: number[]

    constructor(spawn: number[]) {
        this.spawnPoint = spawn
    }
}
// Инициализация в стартовом коде.
const pathService = new PathService('Items/')
const settingsService = new SettingsService([123, 0, 456])
const systems = new proto.Systems(world)
systems
    .addSystem(new System1())
    // Регистрация сервисов.
    .addService(pathService)
    .addService(settingsService)
    .init()
// Получение доступа в системе.
class System1 implements proto.IInitSystem {
    private _svcPath!: PathService
    private _svcSettings!: SettingsService

    init(systems: proto.ISystems) {
        const svc = systems.services()
        this._svcPath = svc.get(PathService.name)
        this._svcSettings = svc.get(SettingsService.name)
    }
}
```


# Специальные типы


## Аспект
Является контейнером для пулов компонентов, существующих в мире.

> **ВАЖНО!** Пулы можно создавать только внутри инициализатора аспекта для мира.

> **ВАЖНО!** Аспекты могут быть частью других аспектов. В конструктор мира передается главный (корневой) аспект,
> являющийся композицией всех аспектов / пулов, из данных которых будет состоять мир.
> Инициализация вложенных аспектов должна выполняться путем вызова методов `init()` и `postInit()`.

```ts
import * as proto from './leopotam.ecsproto/proto'
class Aspect1 implements proto.IAspect {
    c1Pool!: proto.Pool<Component1>

    init(world: proto.World) {
        // Обязательная регистрация этого аспекта для дальнейшего доступа из систем.
        world.addAspect(this)
        // Создание экземпляра пула с кешированием в поле аспекта.
        this.c1Pool = new proto.Pool(Component1)
        // Обязательная регистрация этого пула в мире.
        world.addPool(this.c1Pool)
    }
    postInit() {
        // Дополнительный этап инициализации, если есть вложенные аспекты,
        // созданные в процессе инициализации этого аспекта - у них должен быть
        // вызван метод postInit().
    }
}
```
Аспекты могут выступать в качестве группировки уже существующих пулов:
```ts
import * as proto from './leopotam.ecsproto/proto'
class Aspect2 implements proto.IAspect {
    c1Pool!: proto.Pool<Component1>

    init(world: proto.World) {
        world.addAspect(this)
        if (!world.hasPool(Component1) {
            // Создаем новый пул если не существует.
            this.c1Pool = new ProtoPool(Component1)
            world.addPool(this.c1Pool)
        } else {
            // Получаем существующий пул.
            this.c1Pool = world.pool(Component1.name)
        }
    }
}
```


## Мир
Является контейнером для всех сущностей, данные каждого экземпляра уникальны и изолированы от других миров.

> **ВАЖНО!** Мир не может существовать хотя бы без одного аспекта.

> **ВАЖНО!** Необходимо вызывать `World.destroy()` у экземпляра мира если он больше не нужен.

```ts
import * as proto from './leopotam.ecsproto/proto'
// Создаем мир.
const world = new proto.World(new Aspect1())
// Работаем с миром.
// ...
// Удаляем мир.
world.destroy()
```


## Пул
Является контейнером для компонентов, предоставляет апи для добавления / запроса / удаления компонентов на сущности:
```ts
import * as proto from './leopotam.ecsproto/proto'
const world = new proto.World(new Aspect1())
const entity = world.newEntity()
// Возможный, но нерекомендуемый способ доступа к существующему пулу мира.
const pool: ProtoPool<Component1> = world.Pool(Component1.name)
// Правильный способ доступа к пулу.
const proto1: Aspect1 = world.aspect(Aspect1.name) as Aspect1
pool = proto1.c1Pool

// add() добавляет компонент к сущности.
// Если компонент уже существует - будет брошено исключение в DEBUG-версии.
const c1: Component1 = pool.add(entity)

// has() проверяет наличие компонента на сущности и возвращает результат.
const c1Exists: boolean = pool.has(entity)

// get() возвращает существующий на сущности компонент.
// Если компонент не существовал - будет брошено исключение в DEBUG-версии.
const c1: Component1 = pool.get(entity)

// del() удаляет компонент с сущности. Если компонента не было - ошибки не будет.
// Если это был последний компонент - сущность будет удалена автоматически.
pool.del(entity)

// copy() выполняет копирование всех компонентов с одной сущности на другую.
// Если исходная или целевая сущность не существует - будет брошено исключение в DEBUG-версии.
pool.copy(srcEntity, dstEntity)
```

> **ВАЖНО!** После удаления компонент будет возвращен в пул для последующего переиспользования.
> Все поля компонента будут сброшены в значения по умолчанию автоматически.


## Итератор
Итератор является способом фильтрации сущностей по наличию или отсутствию на них указанных компонентов:
```ts
import * as proto from './leopotam.ecsproto/proto'
class System1 implements IProtoInitSystem, IProtoRunSystem {
    private _aspect!: Aspect1
    private _it!: proto.It

    init(systems: proto.ISystems) {
        // Получаем экземпляр мира по умолчанию.
        const world = systems.world()
        // Получаем аспект мира (из примера выше) и кешируем его.
        this._aspect = world.aspect(Aspect1.name) as Aspect1
        // Создаем итератор с явным указанием типов требуемых (include) компонентов.
        this._it = new proto.It([Component1])
        // Инициализируем его для указания, из какого мира берутся данные.
        this._it.init(world)

        // Создаем новую сущность.
        const entity = world.newEntity()

        // И добавляем к ней компонент "Component1".
        this._aspect.c1Pool.add(entity)
    }

    run() {
        // Мы хотим получить все сущности с компонентом "Component1".
        for (_it.begin(); _it.next();) {
            // получаем доступ к компоненту на отфильтрованной сущности.
            const c1 = this._aspect.c1Pool.get(this._it.entity())
        }
    }
}
```

Если требуется указать отсутствие определенных компонентов, то тип итератора меняется на `ItExc`,
принимающий 2 параметра (include/exclude списки типов):
```ts
// Итератор по сущностям с компонентами `C1`,`C2`, но без `C3`.
const it = new proto.ItExc([C1, C2], [C3]);
```

> **ВАЖНО!** Если цикл прерывается досрочно - необходимо вызвать метод `end()` у итератора:
> ```ts
> for (it.begin(); it.next();) {
>     if (/* условие прерывания */) {
>         it.end()
>         break
>     }
> }
> ```

> **ВАЖНО!** Итераторы должны создаваться один раз на старте и не предназначены для создания динамически в `run()`-системах.

> **ВАЖНО!** Итераторы могут быть частью аспекта, в этом случае они должны инициализироваться в методе `postInit()`:
```ts
import * as proto from './leopotam.ecsproto/proto'
class Aspect2 implements proto.IAspect {
    c1Pool!: proto.Pool<Component1>
    c1It!: proto.It

    init(world: proto.World) {
        world.addAspect(this)
        if (!world.hasPool(Component1) {
            // Создаем новый пул если не существует.
            this.c1Pool = new ProtoPool(Component1)
            world.addPool(this.c1Pool)
        } else {
            // Получаем существующий пул.
            this.c1Pool = world.pool(Component1.name)
        }
        // Создавать итератор можно внутри init(), но без инициализации.
        this.c1It = new proto.It([Component1])
    }
    postInit() {
        // Инициализация итератора.
        this.c1It.init(world)
    }
}
```

## Группа систем
Является контейнером для систем, определяет порядок выполнения (на примере интеграции в CocosCreator):
```ts
import * as cc from 'cc'
import * as proto from './leopotam.ecsproto/proto'
const { ccclass } = cc._decorator

@ccclass('EcsStartup')
export class EcsStartup extends cc.Component {
    private _world!: proto.World
    private _systems!: proto.ISystems

    protected start() {
        // Создаем окружение, подключаем системы.
        this._world = new proto.World(new Aspect1())
        this._systems = new proto.Systems(_world)
        this._systems
            .addSystem(new System1())
            // Можно подключить дополнительные миры.
            // .addWorld(new ProtoWorld(new Aspect2()))
            .init()
    }

    protected update(dt: number) {
        // Выполняем все подключенные системы.
        _systems.run()
    }

    protected onDestroy() {
        // Уничтожаем подключенные системы.
        this._systems.destroy()
        // Очищаем окружение.
        this._world.destroy()
    }
}
```

> **ВАЖНО!** Необходимо вызывать `ISystems.destroy()` у экземпляра группы систем если он больше не нужен.

Системы можно подключать в одном порядке, а выполнять - в другом, для этого существуют контрольные точки:
```ts
systems
    .addSystem(new System1(), 'point3')
    .addSystem(new System2(), 'point2')
    .addSystem(new System3(), 'point1')
    .addPoint('point1')
    .addPoint('point2')
    .addPoint('point3')
    .init()
```
Системы выполнятся в следующем порядке:
> System3 > System2 > System1

> **ВАЖНО!** Контрольные точки должны регистрироваться после регистрации всех систем и модулей.

Если явно не указывать контрольную точку, система будет добавлена до всех контрольных точек:
```ts
systems
    .addSystem(new System1(), 'point3')
    .addSystem(new System2())
    .addSystem(new System3(), 'point2')
    .addSystem(new System4(), 'point1')
    .addPoint('point1')
    .addPoint('point2')
    .addPoint('point3')
    .init()
```
Системы выполнятся в следующем порядке:
> System2 > System4 > System3 > System1


## Модуль
Используется для разделения пользовательского кода на модули:
```ts
class Module1 implements IProtoModule {
    private _point1: string

    constructor(point1) {
        // Если есть необходимость регистрации в определенной
        // контрольной точке - ее имя можно передать через конструктор.
        _point1 = point1;
    }

    init(systems: proto.ISystems) {
        // Регистрация систем и сервисов модуля.
        systems
            .addSystem(new System1(), point1)
            .addService(new Service1())
    }

    // Метод должен вернуть список всех аспектов модуля
    // для возможности автоматизации регистрации модуля целиком.
    aspects(): proto.IAspect[] {
        return [new Aspect1()]
    }
}
class Aspect1 implements proto.IAspect {
    init(world: proto.World) { }
}
class System1 implements IProtoInitSystem {
    init(systems: proto.ISystems) { }
}
class Service1 { }

// Подключение модуля.
systems
    .addModule(new Module1('pointName1'))
    // остальная инициализация
    .addPoint('pointName1')
    .init()
```

Аспект модуля так же может быть вынесен отдельно:
```ts
// Аспект модуля.
class Module1Aspect implements IProtoAspect {
    c1Pool!: proto.Pool<Component1>

    init(world: proto.World) {
        world.AddAspect(this)
        this.c1Pool = new proto.Pool(Component1)
        world.AddPool(C1Pool)
    }
}
// Главный аспект мира, включающий в себя аспекты всех модулей.
class MainAspect : IProtoAspect {
    module1!: Module1Aspect

    init(world: proto.World) {
        world.addAspect(this)
        this.module1 = new Module1Aspect()
        this.module1.init(world)
    }
}
```


# Интеграция с движками


## CocosCreator

Не реализовано.


## Кастомный движок

Каждая часть примера ниже должна быть корректно интегрирована в правильное место выполнения кода движком:
```ts
import * as proto from './leopotam.ecsproto/proto'

class EcsStartup {
    private _world!: proto.World
    private _systems!: proto.ISystems

    // Инициализация окружения.
    void Init() {
        this._world = new proto.World(new Aspect1())
        this._systems = new proto.Systems(_world)
        this._systems
            // Дополнительные экземпляры миров
            // должны быть зарегистрированы здесь.
            // .addWorld(new proto.World(), 'events')

            // Модули должны быть зарегистрированы здесь.
            // .addModule(new TestModule1())
            // .addModule(new TestModule2())

            // Системы с основной логикой должны
            // быть зарегистрированы здесь.
            // .addSystem(new TestSystem1())
            // .addSystem(new TestSystem2())

            // Контрольные точки должны быть
            // зарегистрированы здесь.
            // .addPoint('point1')

            // Сервисы могут быть добавлены в любом месте.
            // .addService(new TestService1())

            .init()
    }

    // Метод должен быть вызван из
    // основного update-цикла движка.
    updateLoop() {
        _systems.Run();
    }

    // Очистка окружения.
    destroy() {
        this._systems.destroy()
        this._world.destroy()
    }
}
```


# Лицензия
Фреймворк выпускается под коммерческой лицензией, [подробности тут](./LICENSE.md).


# ЧаВо


### Меня не устраивают значения по умолчанию для полей компонентов. Как я могу это настроить?
Компоненты поддерживают установку произвольных значений через реализацию интерфейса `IAutoReset<>`:
```ts
class MyComponent implements proto.IAutoReset<MyComponent> {
    id: number = 0
    someExternalData: any

    autoReset(c: MyComponent) {
        c.Id = 2
        c.SomeExternalData = null
    }
}
```
Этот метод будет автоматически вызываться для всех новых компонентов, а так же для всех только что удаленных, до помещения их в пул.
> **ВАЖНО!** В случае применения `IAutoReset` все дополнительные очистки/проверки полей компонента отключаются, что может привести к утечкам памяти. Ответственность лежит на пользователе!


### Меня не устраивают значения для полей компонентов при их копировании через World.CopyEntity() или IPool.copy(). Как я могу это настроить?
Компоненты поддерживают установку произвольных значений при вызове `World.copyEntity()` или `IPool.copy()` через реализацию интерфейса `IAutoCopy<>`:
```ts
class MyComponent implements proto.IAutoCopy<MyComponent> {
    id: number = 0

    autoCopy(src: MyComponent, dst: MyComponent) {
        dst.id = src.id * 123
    }
}
```
> **ВАЖНО!** В случае применения `IAutoCopy` никакого копирования по умолчанию не происходит. Ответственность за корректность заполнения данных и за целостность исходных лежит на пользователе!


### Я хочу сохранить ссылку на сущность в компоненте. Как я могу это сделать?
Для этого следует реализовать сохранение Id+Gen сущности самостоятельно, либо воспользоваться реализацией из `QoL`-расширении.


### Я хочу добавить реактивности и обрабатывать события изменений в мире самостоятельно. Как я могу сделать это?
> **ВАЖНО!** Так делать не рекомендуется из-за падения производительности.

Для активации этого функционала следует включить специальный режим, а затем - добавить слушатель событий:
```ts
import * as proto from './leopotam.ecsproto/proto'
class TestEventListener implements proto.IEventListener {
    onEntityCreated(entity: proto.Entity) {
        // Сущность создана - метод будет вызван в момент вызова world.newEntity().
    }

    onEntityChanged(entity: Entity, poolId: number, added: boolean) {
        // Сущность изменена - метод будет вызван в момент вызова pool.add() / pool.del().
    }

    onEntityDestroyed(entity: proto.Entity) {
        // Сущность уничтожена - метод будет вызван в момент вызова world.delEntity() или в момент удаления последнего компонента.
    }

    onWorldResized(capacity: number) {
        // Мир изменил размеры - метод будет вызван в случае изменения размеров кешей под сущности в момент вызова world.newEntity().
    }

    onWorldDestroyed() {
        // Мир уничтожен - метод будет вызван в момент вызова world.destroy().
    }
}

// Инициализация окружения.
// Включение режима событий мира.
proto.setWorldEvents()
const world = new proto.World(new Aspect1())
const listener = new TestEventListener()
world.addEventListener(listener)
```


### Я хочу измерить время, потраченное каждой системой на свое выполнение. Как я могу сделать это?
> **ВАЖНО!** Так делать не рекомендуется из-за снижения производительности.

Для активации этого функционала следует включить специальный режим:
```ts
import * as proto from './leopotam.ecsproto/proto'
// Включение режима измерения времени работы систем.
proto.setSystemBenches()
const world = new proto.World(new Aspect1())
const systems = new proto.Systems(world)
systems
    .addSystem(new System1())
    .addSystem(new System2())
    .addSystem(new System3())
    .init()
systems.run()
systems.destroy()
world.destroy()
const allSystems = systems.systems()
let time: number
for (let i = 0; i < allSystems.len(); i++) {
    // Время работы системы хранится целым числом в сотых долях миллисекундах.
    // Для обратной конвертации в миллисекунды значение достаточно разделить на 100.
    // Если число отрицательное, то значит тип системы не совместим с
    // запрашиваемым типом счетчика.
    time = _systems.bench(i, proto.BenchType.PreInit)
    console.log(`${allSystems.get(i).constructor.name}.preInit = ${time * 0.01}`)
    time = _systems.bench(i, proto.BenchType.Init)
    console.log(`${allSystems.get(i).constructor.name}.init = ${time * 0.01}`)
    time = _systems.bench(i, proto.BenchType.Run)
    console.log(`${allSystems.get(i).constructor.name}.run = ${time * 0.01}`)
    time = _systems.bench(i, proto.BenchType.PostRun)
    console.log(`${allSystems.get(i).constructor.name}.postRun = ${time * 0.01}`)
    time = _systems.Bench(i, proto.BenchType.Destroy)
    console.log(`${allSystems.get(i).constructor.name}.destroy = ${time * 0.01}`)
    time = _systems.bench(i, proto.BenchType.PostDestroy)
    console.log(`${allSystems.get(i).constructor.name}.postDestroy = ${time * 0.01}`)
}
```


### Мне не нравится стандартный способ итерирования, я хочу использовать for-of-цикл. Как я могу это сделать?
Для этого следует реализовать кастомный энумератор для типа итератора, либо воспользоваться реализацией из `QoL`-расширения.


### Я хочу использовать модули в своем коде и у меня возникают проблемы с подключением аспектов из разных модулей - мир требует ручной сборки корневого аспекта. Как я могу это упростить?
Для этого следует воспользоваться `Modules`-классом из `QoL`-расширения.