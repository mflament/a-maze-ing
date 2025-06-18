import type {Size} from "../Maze.ts";

export class VisitedTiles {
    private readonly visited: Uint8Array;
    private _count = 0;

    constructor(size: Size) {
        this.visited = new Uint8Array(size.width * size.height);
    }

    get count(): number {
        return this._count
    }

    isVisited(i: number) {
        return this.visited[i] !== 0;
    }

    setVisited(i: number) {
        if (!this.visited[i]) {
            this.visited[i] = 1;
            this._count++;
        }
    }
}