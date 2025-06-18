import {type Direction, DOWN, LEFT, Maze, RIGHT, type Size, UP} from "../Maze.ts";
import type {MazeGenerator, MazeGeneratorResult, GeneratorProgressCallback} from "./MazeGenerator.ts";
import {mulberry32} from "../Utils.ts";

/**
 * Randomized depth-first search
 * https://en.wikipedia.org/wiki/Maze_generation_algorithm#Iterative_implementation_(with_stack)
 */
export class RandomizedDepthFirstMazeGenerator implements MazeGenerator {

    readonly name = "RandomizedDepthFirst";

    private readonly seed?: number;

    constructor(seed?: number) {
        this.seed = seed;
    }

    async generate(size: Size, progressCallback?: GeneratorProgressCallback): Promise<MazeGeneratorResult | undefined> {
        const maze = new Maze(size);
        maze.fences.fill(0xFF);

        if (progressCallback && !await progressCallback(maze))
            return undefined;

        const {width, height} = size;
        const visitedCells = new Uint8Array(width * height);
        const nextDirections: Direction[] = new Array(4);
        const stack: number[] = [];

        const cellIndex = (x: number, y: number) => {
            if (x < 0 || x >= width || y < 0 || y >= height) return -1;
            return y * width + x;
        }

        const isVisited = (cellIndex: number) => visitedCells[cellIndex] !== 0;
        const setVisited = (cellIndex: number) => visitedCells[cellIndex] = 1;


        const prng = mulberry32(this.seed);
        const seed = prng.seed;
        const randomInt = (max: number) => Math.floor(prng.next() * max);

        const getNextDirections = (x: number, y: number): number => {
            let count = 0;

            let neighborIndex = cellIndex(x, y + 1);
            if (neighborIndex >= 0 && !isVisited(neighborIndex)) nextDirections[count++] = UP;

            neighborIndex = cellIndex(x + 1, y)
            if (neighborIndex >= 0 && !isVisited(neighborIndex)) nextDirections[count++] = RIGHT;

            neighborIndex = cellIndex(x, y - 1)
            if (neighborIndex >= 0 && !isVisited(neighborIndex)) nextDirections[count++] = DOWN;

            neighborIndex = cellIndex(x - 1, y)
            if (neighborIndex >= 0 && !isVisited(neighborIndex)) nextDirections[count++] = LEFT;

            return count;
        }

        const getNeighborIndex = (x: number, y: number, dir: number) => {
            switch (dir) {
                case UP:
                    y += 1;
                    break;
                case RIGHT:
                    x += 1;
                    break;
                case DOWN:
                    y -= 1;
                    break;
                case LEFT:
                    x -= 1;
                    break;
            }
            return y * width + x;
        }

        // 1. Choose the initial cell, mark it as visited and push it to the stack
        let currentCell = randomInt(visitedCells.length);
        setVisited(currentCell);
        stack.push(currentCell);

        // 2. While the stack is not empty
        while (stack.length !== 0) {
            // 1. Pop a cell from the stack and make it a current cell
            currentCell = stack.pop()!;
            // 2. If the current cell has any neighbours which have not been visited
            const x = currentCell % width, y = Math.floor(currentCell / width);
            const count = getNextDirections(x, y);
            if (count > 0) {
                // 1. Push the current cell to the stack
                stack.push(currentCell);
                // 2. Choose one of the unvisited neighbours
                const dir = nextDirections[randomInt(count)];
                // 3. Remove the wall between the current cell and the chosen cell
                maze.setBlocked(x, y, dir, false);
                // 4. Mark the chosen cell as visited and push it to the stack
                const neighborIndex = getNeighborIndex(x, y, dir)
                setVisited(neighborIndex);
                stack.push(neighborIndex);
                if (progressCallback && !await progressCallback(maze))
                    return undefined;
            }
        }

        return {maze, seed};
    }
}
