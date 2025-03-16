interface IIterator {
    begin(): void;
    next();
    end(): void;
};

class Iterator<T extends { length: number }> {
    private data: T;
    private static index: number;
    
    constructor(data: T) {
        this.data = data;
        Iterator.index = 0;
    }

    public begin(index: number = 0): void {
        Iterator.index = index;
    }

    public next() {
        if (Iterator.index >= this.data.length) return undefined;
        return this.data[Iterator.index++];
    }

    public end(): void {
        Iterator.index = this.data.length - 1;
    }
};

export { IIterator, Iterator };