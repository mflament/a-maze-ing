import type {Maze} from "../Maze.ts";

export type MazePath = number[];


export const CONTINUE = 0;
export const SOLVE = 1;
export const CANCELED = 2;

export type CallbackResult = typeof CONTINUE |  typeof SOLVE | typeof CANCELED;
export type SolverProgressCallback = () => Promise<CallbackResult>;

export interface MazeSolver {

    readonly name: string;

    solve(maze: Maze, start: number, exit: number, progressCallback?: SolverProgressCallback): Promise<MazePath | undefined>;

}