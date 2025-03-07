class EcsAspect {
    init (world: EcsWorld) {
        world.
        for (field in Object.keys(this)) {
            if (!world.has(field)) {
                world.CreatePool(field)
            }
            field = ref world.Get(field)
        }
    }
    GetFields() {
        return this.keys();
    }
};

export default EcsAspect;