import {DOWN, LEFT, type Maze, RIGHT, UP} from "../Maze.ts";
import {BLOCKED, EXIT, type MazeRenderer, type TileStatus, VISITED, VISITING} from "../MazeRenderer.ts";
import {type MazePath, SOLVE, type SolverProgressCallback} from "./MazeSolver.ts";
import {AbstractMazeSolver} from "./AbstractMazeSolver.ts";

export class BreadthFirstMazeSolver extends AbstractMazeSolver {

    constructor(renderer: MazeRenderer) {
        super(renderer);
    }

    get name(): string {
        return "BreadthFirst";
    }

    async solve(maze: Maze, start: number, exit: number, progressCallback?: SolverProgressCallback): Promise<MazePath | undefined> {
        const {width, height} = maze.size;
        const previous = new Int32Array(width * height);
        previous.fill(-1);

        let current = new TilesList(width * height);
        let next = new TilesList(width * height);

        const neighbors = new TilesList(4);
        const getNeighbors = (tileIndex: number): number => {
            const x = tileIndex % width, y = Math.floor(tileIndex / width);
            neighbors.clear();
            if (y < height - 1 && previous[tileIndex + width] < 0 && !maze.isBlocked(x, y, UP)) neighbors.push(tileIndex + width);
            if (x < width - 1 && previous[tileIndex + 1] < 0 && !maze.isBlocked(x, y, RIGHT)) neighbors.push(tileIndex + 1);
            if (y > 0 && previous[tileIndex - width] < 0 && !maze.isBlocked(x, y, DOWN)) neighbors.push(tileIndex - width);
            if (x > 0 && previous[tileIndex - 1] < 0 && !maze.isBlocked(x, y, LEFT)) neighbors.push(tileIndex - 1);
            return neighbors.count;
        }
        const renderer = this.renderer;
        const setTileStatus = (p: number, s: TileStatus) => {
            if (p !== start && p !== exit) renderer.setTileStatus(p, s);
        }

        previous[start] = start;
        current.push(start);
        let length = 1;
        while (current.count > 0) {
            next.clear();
            for (let i = 0; i < current.count; i++) {
                const c = current.get(i);
                setTileStatus(c, VISITED)
                const neighborCount = getNeighbors(c);
                if (neighborCount === 0 && next.indexOf(c) < 0)
                    setTileStatus(c, BLOCKED);

                for (let j = 0; j < neighborCount; j++) {
                    const neighbor = neighbors.get(j);
                    previous[neighbor] = c;
                    if (neighbor === exit)
                        return this.createMazePath(length + 1, previous, start, exit);
                    next.push(neighbor);
                    setTileStatus(neighbor, VISITING);
                }
            }
            length++;

            const tmp = current;
            current = next;
            next = tmp;
            if (progressCallback) {
                const cr = await progressCallback();
                if (cr === SOLVE)
                    progressCallback = undefined;
                else if (cr === EXIT)
                    break;
            }
        }

        return undefined;
    }

    private createMazePath(length: number, previous: Int32Array, start: number, exit: number) {
        const res = new Array(length);
        let p = exit;
        for (let i = length - 1; i >= 0; i--) {
            res[i] = p;
            p = previous[p];
        }
        if (p !== start) throw new Error("unexpected path start " + p + " expecting " + start);
        return res;
    }

    protected nextTileSupplier(): { (p: number): number } {
        throw new Error("unsupported");
    }

}

class TilesList {
    private readonly tiles: Uint32Array;
    private _count = 0;

    constructor(tileCount: number) {
        this.tiles = new Uint32Array(tileCount);
    }

    get count() {
        return this._count;
    }

    push(tile: number): void {
        this.tiles[this._count++] = tile;
    }

    clear(): void {
        this._count = 0;
    }

    get(index: number): number {
        if (index < this._count) return this.tiles[index];
        throw new Error(`index ${index} is out of bounds ([0, ${this._count}[).`);
    }

    indexOf(tile: number): number {
        for (let i = 0; i < this._count; i++) {
            if (this.tiles[i] === tile) return i;
        }
        return -1;
    }

}
