import {type MazePath, type MazeSolver, SOLVE, type SolverProgressCallback,} from "./MazeSolver.ts";
import {type Maze} from "../Maze.ts";
import {BLOCKED, EXIT, type MazeRenderer, type TileStatus, VISITED, VISITING} from "../MazeRenderer.ts";
import {Path} from "./Path.ts";
import {VisitedTiles} from "./VisitedTiles.ts";

export abstract class AbstractMazeSolver implements MazeSolver {

    protected readonly renderer: MazeRenderer;

    protected constructor(renderer: MazeRenderer) {
        this.renderer = renderer;
    }

    async solve(maze: Maze, start: number, exit: number, progressCallback?: SolverProgressCallback): Promise<MazePath | undefined> {
        const path = new Path(maze.size, start);
        const visited = new VisitedTiles(maze.size);
        visited.setVisited(start);


        const nextTileSupplier = this.nextTileSupplier(maze, visited);
        const tilesCount = maze.size.width * maze.size.height;
        const renderer = this.renderer;
        const setTileStatus = (p: number, s: TileStatus) => {
            if (p !== start && p !== exit)  renderer.setTileStatus(p, s);
        }

        while (path.position !== exit && visited.count < tilesCount) {
            setTileStatus(path.position, VISITED);
            const next = nextTileSupplier(path.position);
            if (next >= 0) {
                path.moveTo(next);
                visited.setVisited(next);
                setTileStatus(path.position, VISITING);
            } else {
                setTileStatus(path.position, BLOCKED);
                path.moveBack();
                setTileStatus(path.position, VISITING);
            }
            if (progressCallback) {
                const cr = await progressCallback();
                if (cr === SOLVE)
                    progressCallback = undefined;
                else if (cr === EXIT)
                    return undefined;
            }
        }

        if (path.position === exit)
            return path.mazePath();

        return undefined;
    }

    abstract get name(): string;

    protected abstract nextTileSupplier(maze: Maze, visited: VisitedTiles): (p: number) => number;
}

