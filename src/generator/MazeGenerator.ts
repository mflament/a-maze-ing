import {Maze, type Size} from "../Maze.ts";

export type GeneratorProgressCallback = (maze: Maze) => Promise<boolean>;

export type MazeGeneratorResult = { maze: Maze, seed: number };

/**
 * refs :
 * https://en.wikipedia.org/wiki/Maze_generation_algorithm
 */
export interface MazeGenerator {

    readonly name: string;

    generate(size: Size, progressCallback?: GeneratorProgressCallback): Promise<MazeGeneratorResult | undefined>;

}
