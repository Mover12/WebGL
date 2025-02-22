var entitiesList = [];
var componentsList = [];

class Entity {
    id;
    constructor(id) {
        this.id = id;
    }
    addComponet(component) {
        if (!componentsList[this.id]) {
            componentsList[this.id] = new Map();
        }
        if (!entitiesList[component.id]) {
            entitiesList[component.id] = new Set();
        }
        componentsList[this.id][component.id] = component;
        entitiesList[component.id].add(this.id);
    }
}
class Component {
    id;
    constructor(id) {
        this.id = id;
    }
}


class TestComponent extends Component {
    test=0;
}


function init() {
    for (var i = 0; i < 500000; i++) {
        var entity = new Entity(i);
        entity.addComponet(new TestComponent(0));
        entity.addComponet(new TestComponent(1));
        entity.addComponet(new TestComponent(2));
        entity.addComponet(new TestComponent(3));
    }
}
function update() {
    for(var entitiy of entitiesList[0].intersection(entitiesList[1]).intersection(entitiesList[2]).intersection(entitiesList[3])) {
        componentsList[entitiy][0].test++;
        componentsList[entitiy][1].test++;
        componentsList[entitiy][2].test++;
        componentsList[entitiy][3].test++;
    }
}

function main() {
    init()

    setInterval(() => {
        update();
    }, 1/60);

}

main();