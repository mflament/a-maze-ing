export interface Size {
    width: number;
    height: number;
}

export const UP = 0;
export const RIGHT = 1;
export const DOWN = 2;
export const LEFT = 3;

export type UpType = typeof UP;
export type RightType = typeof RIGHT;
export type DownType = typeof DOWN;
export type LeftType = typeof LEFT;
export type Direction = UpType | RightType | DownType | LeftType;

export class Maze {

    /**
     * 2 bits per tile : UP and RIGHT fence, row first, origin is bottom left.
     */
    readonly fences: Uint8Array;

    public readonly size: Readonly<Size>;

    constructor(p: Size | Maze) {
        if (p instanceof Maze) {
            this.size = {...p.size};
            this.fences = new Uint8Array(p.fences.length);
            this.fences.set(p.fences, 0);
        } else {
            if (p.width === 1 && p.height === 1) throw Error("Invalid maze size " + JSON.stringify(p));
            this.size = p
            const storageSize = Maze.fencesStorageSize(this.size);
            console.debug({size: this.size, storageSize});
            this.fences = new Uint8Array(storageSize);
        }
    }

    clear() {
        this.fences.fill(0);
    }

    isBlocked(tileX: number, tileY: number, dir: Direction): boolean {
        const idx = this.fenceIndex(tileX, tileY, dir);
        if (idx < 0)
            return true;
        return this.get(idx);
    }

    setBlocked(tileX: number, tileY: number, dir: Direction, blocked = true): void {
        const idx = this.fenceIndex(tileX, tileY, dir);
        if (idx < 0)
            throw new Error("Invalid fence reference : " + JSON.stringify({tileX, tileY, dir}));
        this.set(idx, blocked);
    }

    private fenceIndex(tileX: number, tileY: number, dir: Direction) {
        const {width, height} = this.size;
        let x = tileX, y = tileY, m;
        switch (dir) {
            case UP:
                if (y === height - 1) return -1;
                m = 0;
                break;
            case RIGHT:
                if (x === width - 1) return -1;
                m = 1;
                break;
            case DOWN:
                if (y === 0) return -1;
                y -= 1;
                m = 0;
                break;
            case LEFT:
                if (x === 0) return -1;
                x -= 1;
                m = 1;
                break;
        }
        return (y * width + x) * 2 + m;
    }

    private get(fenceIndex: number): boolean {
        const storageIndex = Math.floor(fenceIndex / 8);
        const shift = fenceIndex % 8;
        return ((this.fences[storageIndex] >> shift) & 1) !== 0;
    }

    private set(fenceIndex: number, blocked: boolean) {
        const storageIndex = Math.floor(fenceIndex / 8);
        const shift = fenceIndex % 8;
        if (blocked) {
            this.fences[storageIndex] |= (1 << shift);
        } else {
            this.fences[storageIndex] &= ~(1 << shift);
        }
    }

    private static fencesStorageSize(size: Size) {
        const bits = size.width * size.height * 2;
        return Math.ceil(bits / 8);
    }

}
