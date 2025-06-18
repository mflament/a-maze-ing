import {DOWN, LEFT, type Maze, RIGHT, UP} from "../Maze.ts";
import {VisitedTiles} from "./VisitedTiles.ts";
import {mulberry32} from "../Utils.ts";
import {AbstractMazeSolver} from "./AbstractMazeSolver.ts";
import type {MazeRenderer} from "../MazeRenderer.ts";

export class RandomDepthFirstMazeSolver extends AbstractMazeSolver {

    private readonly seed?: number;

    constructor(renderer: MazeRenderer, seed?: number) {
        super(renderer);
        this.seed = seed;
    }

    get name(): string {
        return "RandomDepthFirst";
    }

    protected nextTileSupplier(maze: Maze, visited: VisitedTiles): (p: number) => number {
        const neighbors: number[] = new Array(4);
        const prng = mulberry32(this.seed);
        const randomInt = (max: number) => Math.floor(prng.next() * max);
        const width = maze.size.width;
        return (p: number) => {
            let count = 0;
            const x = p % width, y = Math.floor(p / width);
            if (!maze.isBlocked(x, y, UP) && !visited.isVisited(p + width)) neighbors[count++] = p + width;
            if (!maze.isBlocked(x, y, RIGHT) && !visited.isVisited(p + 1)) neighbors[count++] = p + 1;
            if (!maze.isBlocked(x, y, DOWN) && !visited.isVisited(p - width)) neighbors[count++] = p - width;
            if (!maze.isBlocked(x, y, LEFT) && !visited.isVisited(p - 1)) neighbors[count++] = p - 1;
            return count === 0 ? -1 : neighbors[randomInt(count)];
        }
    }
}