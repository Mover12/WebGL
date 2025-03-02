// var entities = [];
// var entitiesList = [];
// var componentsList = [];

// class Entity {
//     id;
//     components=0;
//     constructor(id) {
//         this.id = id;
//     }
//     addComponet(component) {
//         if (!componentsList[this.id]) {
//             componentsList[this.id] = new Map();
//         }
//         if (!entitiesList[component.id]) {
//             entitiesList[component.id] = new Set();
//         }
//         componentsList[this.id][component.id] = component;
//         entitiesList[component.id].add(this.id);
//         this.components |= (1 << component.id);
//         for(let i = 0; i < filters.length; i++) {
//             if ((this.components & filters[i]) == filters[i]) {
//                 filtered[i].add(this.id);
//             } else {
//                 filtered[i].delete(this.id);
//             }
//         }
//     }
// }
// class Component {
//     id;
//     constructor(id) {
//         this.id = id;
//     }
// }


// class TestComponent extends Component {
//     test=0;
// }
// var filtered = [new Set()];
// var filters = [3];
// function init() {
//     for (var i = 0; i < 1; i++) {
//         entities.push(new Entity(i));
//     }
// }

// var compid=0;
// function update() {
//     compid++;
//     for (var i = 0; i < entities.length; i++) {
//         entities[i].addComponet(new TestComponent(compid));
//     }
// }

// function main() {
//     init()

//     setInterval(() => {
//         update();
//     }, 1/60);

// }

// main();