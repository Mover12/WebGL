class Iterator<T> {
    data: T;
    currentElement: any;
    static index: number = 0;
    constructor(data: T) {
        this.data = data;
    }
    begin() {
        Iterator.index = 0;
    }
    next() {
        this.currentElement = this.data[Iterator.index++];
        if (Iterator.index >= this.data.length) {
            this.begin();
            return null;
        }
        return this.currentElement;
    }
    end() {
        Iterator.index = this.data.length - 1;
    }
}

export { Iterator }