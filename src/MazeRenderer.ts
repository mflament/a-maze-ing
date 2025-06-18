import type {Maze} from "./Maze.ts";


export const NONE = 0;
export const START = 1;
export const EXIT = 2;
export const VISITING = 3;
export const VISITED = 4;
export const BLOCKED = 5;
export const PATH = 6;

export type TileStatus =
    typeof NONE
    | typeof START
    | typeof EXIT
    | typeof VISITING
    | typeof VISITED
    | typeof BLOCKED
    | typeof PATH;

export interface MazeRenderer {

    maze?: Maze;

    addListener(listener: MazeRendererListener): void;

    removeListener(listener: MazeRendererListener): void;

    setTileStatus(tileIndex: number, status: TileStatus): void;

    dispose(): void;

}

export interface MazeRendererListener {

    enterTile?(pos: number): void;

    leaveTile?(pos: number): void;

    tileClicked?(pos: number, e: MouseEvent): void;

    tileDblClicked?(pos: number, e: MouseEvent): void;

}
