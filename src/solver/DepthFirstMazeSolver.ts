import {DOWN, LEFT, type Maze, RIGHT, UP} from "../Maze.ts";
import {AbstractMazeSolver} from "./AbstractMazeSolver.ts";
import {VisitedTiles} from "./VisitedTiles.ts";
import type {MazeRenderer} from "../MazeRenderer.ts";

export class DepthFirstMazeSolver extends AbstractMazeSolver {

    constructor(renderer: MazeRenderer) {
        super(renderer);
    }

    get name(): string {
        return "DepthFirst";
    }

    protected nextTileSupplier(maze: Maze, visited: VisitedTiles): (p: number) => number {
        return (p: number) => {
            const width = maze.size.width;
            const x = p % width, y = Math.floor(p / width);
            if (!maze.isBlocked(x, y, UP) && !visited.isVisited(p + width)) return p + width;
            if (!maze.isBlocked(x, y, RIGHT) && !visited.isVisited(p + 1)) return p + 1;
            if (!maze.isBlocked(x, y, DOWN) && !visited.isVisited(p - width)) return p - width;
            if (!maze.isBlocked(x, y, LEFT) && !visited.isVisited(p - 1)) return p - 1;
            return -1;
        }
    }

}


