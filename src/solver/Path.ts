import type {Size} from "../Maze.ts";
import type {MazePath} from "./MazeSolver.ts";

export class Path {
    readonly start: number;
    readonly previous = new Int32Array();
    position: number;
    length: number;

    constructor(size: Size, start: number) {
        this.previous = new Int32Array(size.width * size.height);
        this.previous.fill(-1);
        this.start = start;
        this.previous[start] = start;
        this.position = start;
        this.length = 1;
    }

    isVisited(i: number): boolean {
        return this.previous[i] >= 0;
    }

    moveTo(p: number) {
        if (this.previous[p] >= 0)
            throw new Error(p + " was already in path");
        this.previous[p] = this.position;
        this.position = p;
        this.length++;
    }

    moveBack() {
        const from = this.previous[this.position];
        this.previous[this.position] = -1;
        this.position = from;
        this.length--;
    }

    mazePath(): MazePath {
        const previous = this.previous;
        const res = new Array(this.length);
        let p = this.position;
        for (let i = this.length - 1; i >= 0; i--) {
            res[i] = p;
            p = previous[p];
        }
        if (p !== this.start) throw new Error("unexpected path start " + p + " expecting " + this.start);
        return res;
    }

}