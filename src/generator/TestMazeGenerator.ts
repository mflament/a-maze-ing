import {Maze, RIGHT, type Size, UP} from "../Maze.ts";
import type {MazeGenerator, MazeGeneratorResult, GeneratorProgressCallback} from "./MazeGenerator.ts";
import {mulberry32} from "../Utils.ts";

export class TestMazeGenerator implements MazeGenerator {

    readonly name = "Test";

    private readonly seed?: number;

    constructor(seed?: number) {
        this.seed = seed;
    }


    async generate(size: Size, progressCallback?: GeneratorProgressCallback): Promise<MazeGeneratorResult | undefined> {
        const maze = new Maze(size);
        if (progressCallback && !await progressCallback(maze))
            return undefined;

        const prng = mulberry32(this.seed);
        const seed = prng.seed;
        const randomInt = (max: number) => Math.floor(prng.next() * max);
        const {width, height} = size;
        for (let i = 0; i < 100; i++) {
            maze.setBlocked(randomInt(width - 1), randomInt(height - 1), randomInt(2) === 0 ? UP : RIGHT, true);
            if (progressCallback && !await progressCallback(maze))
                return undefined;
        }
        return {maze, seed};
    }
}