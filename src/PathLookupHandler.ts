import {EXIT, type MazeRenderer, type MazeRendererListener, NONE, START} from "./MazeRenderer.ts";

export class PathLookupHandler implements MazeRendererListener {

    private readonly renderer: MazeRenderer;
    private _start = -1;
    private _exit = -1;

    constructor(renderer: MazeRenderer) {
        this.renderer = renderer;
    }

    get start(): number {
        return this._start;
    }

    set start(start: number) {
        const renderer = this.renderer;
        if (this._start >= 0 && this._start !== start) renderer.setTileStatus(this._start, NONE);
        this._start = start;
        if (start >= 0)
            renderer.setTileStatus(start, START);
    }

    get exit(): number {
        return this._exit;
    }

    set exit(exit: number) {
        const renderer = this.renderer;
        if (this._exit >= 0 && this._exit !== exit) renderer.setTileStatus(this._exit, NONE);
        this._exit = exit;
        if (exit >= 0)
            renderer.setTileStatus(exit, EXIT);
    }

    tileClicked(tileIndex: number): void {
        if (this._start < 0) {
            this.start = tileIndex;
        } else if (this._exit < 0) {
            if (tileIndex === this._start) this.start = -1;
            else this.exit = tileIndex;
        } else if (tileIndex === this._exit) {
            this.exit = -1;
        } else if (tileIndex !== this._start) {
            this.exit = tileIndex;
        }
    }

}