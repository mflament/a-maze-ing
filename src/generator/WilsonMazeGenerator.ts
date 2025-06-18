import type {MazeGenerator, MazeGeneratorResult, GeneratorProgressCallback} from "./MazeGenerator.ts";
import {mulberry32, type PRNG} from "../Utils.ts";
import {DOWN, LEFT, Maze, RIGHT, type Size, UP} from "../Maze.ts";

/**
 * https://en.wikipedia.org/wiki/Maze_generation_algorithm#Wilson's_algorithm
 * https://www.cs.cmu.edu/~15859n/RelatedWork/RandomTrees-Wilson.pdf
 * https://gist.github.com/mbostock/11357811
 */
export class WilsonMazeGenerator implements MazeGenerator {

    readonly name = "Wilson";

    private readonly seed?: number;

    constructor(seed?: number) {
        this.seed = seed;
    }


    async generate(size: Size, progressCallback?: GeneratorProgressCallback): Promise<MazeGeneratorResult | undefined> {
        const maze = new Maze(size);
        maze.fences.fill(0xFF);
        if (progressCallback && !await progressCallback(maze))
            return undefined;

        const {width, height} = maze.size;

        const visitedTiles = new Uint8Array(width * height); // 0|1 per tile index
        const remainingTiles = this.remainingTiles(visitedTiles);

        const previous = new Int32Array(visitedTiles.length); // path between i0 and i1 as index to previous tile from each tile (-1 if not in path)
        previous.fill(-1);

        const prng = mulberry32(this.seed);
        const seed = prng.seed;
        const randomSuccessor = this.randomSuccessorIterator(size, prng);

        /**
         * make a random walk until a visited tile. return the visited tile index
         */
        const randomWalk = async (i0: number): Promise<boolean> => {
            previous[i0] = i0;
            while (true) {
                // Perform a random walk starting at i0 location,
                // by picking a legal random direction.
                let i1 = randomSuccessor(i0);
                // If this new cell was visited previously during this walk,
                // erase the loop, rewinding the path to its earlier state.
                if (previous[i1] >= 0) {
                    eraseWalk(i0, i1);
                } else {
                    // Otherwise, just add it to the walk.
                    previous[i1] = i0;
                }
                // If this cell is part of the maze, we’re done walking.
                if (visitedTiles[i1] !== 0) {
                    // Add the random walk to the maze by backtracking to the starting cell.
                    // Also erase this walk’s history to not interfere with subsequent walks.
                    while ((i0 = previous[i1]) !== i1) {
                        const x = i0 % width, y = Math.floor(i0 / width);
                        const blocked = false;
                        if (i1 === i0 + width) maze.setBlocked(x, y, UP, blocked);
                        else if (i1 == i0 + 1) maze.setBlocked(x, y, RIGHT, blocked);
                        else if (i1 == i0 - width) maze.setBlocked(x, y, DOWN, blocked);
                        else if (i1 == i0 - 1) maze.setBlocked(x, y, LEFT, blocked);
                        visitedTiles[i1] = 1;
                        previous[i1] = -1;
                        i1 = i0;
                    }
                    previous[i1] = -1;
                    break;
                } else {
                    // continue walk
                    i0 = i1;
                }
            }
            return !progressCallback || await progressCallback(maze);
        }

        const eraseWalk = (i0: number, i2: number) => {
            let i1;
            do {
                i1 = previous[i0];
                previous[i0] = -1;
                i0 = i1;
            } while (i1 !== i2);
        }


        // While there are remainingIndices cells,
        // add a loop-erased random walk to the maze.
        let i0 = remainingTiles.next();
        visitedTiles[i0] = 1;
        while ((i0 = remainingTiles.next()) >= 0) {
            if (!await randomWalk(i0))
                return undefined;
        }

        return {maze, seed} ;
    }

    private randomSuccessorIterator(size: Size, prng : PRNG): (i0: number) => number {
        const {width, height} = size;
        const randomInt = (max: number) => Math.floor(prng.next() * max);
        return (i0: number) => {
            const x = i0 % width, y = Math.floor(i0 / width);
            while (true) {
                const dir = randomInt(4);
                if (dir === UP && y < height - 1) return i0 + width;
                if (dir === RIGHT && x < width - 1) return i0 + 1;
                if (dir === DOWN && y > 0) return i0 - width;
                if (dir === LEFT && x > 0) return i0 - 1;
            }
        }
    }

    private remainingTiles(visitedTiles: Uint8Array) {
        let index = 0;
        return {
            /**
             * return first unvisited tile index, null if no more tiles
             */
            next(): number {
                while (index < visitedTiles.length) {
                    if (visitedTiles[index++] === 0) {
                        return index - 1;
                    }
                }
                return -1;
            }
        }
    }
}

