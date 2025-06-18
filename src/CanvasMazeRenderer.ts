import {type Maze, RIGHT, UP} from "./Maze.ts";
import {type MazeRenderer, type MazeRendererListener, type TileStatus} from "./MazeRenderer.ts";

export class CanvasMazeRenderer implements MazeRenderer {

    private static readonly FENCE_STROKE_STYLE = 'white';
    private static readonly FENCE_WIDTH = 2.5;

    private static readonly TILE_COLORS: string[] = ['', // NONE
        '#0000FFFF', '#FFFF00FF', // START, EXIT
        '#FF00FFFF', '#B900B9', '#FF0000FF', // VISITING VISITED BLOCKED
        '#00FF00FF' // PATH
    ];

    private readonly canvas: HTMLCanvasElement;
    private readonly observer = new ResizeObserver(() => this.resize());
    private readonly listeners: MazeRendererListener[] = [];

    private mazeData?: MazeData;

    private readonly context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.observer.observe(canvas);
        const context = canvas.getContext('2d');
        if (!context) throw new Error("No 2d context");
        this.context = context;
        this.resize();

        canvas.addEventListener('click', this.click);
        canvas.addEventListener('dblclick', this.dblclick);
        canvas.addEventListener('mousemove', this.mousemove);
        canvas.addEventListener('mouseenter', this.mousemove);
        canvas.addEventListener('mouseleave', this.mousemove);
    }

    get maze(): Maze | undefined {
        return this.mazeData?.maze
    }

    set maze(maze: Maze | undefined) {
        this.mazeData = maze ? new MazeData(maze, this.canvas) : undefined;
        requestAnimationFrame(this.redraw)
    }

    setTileStatus(tileIndex: number, status: TileStatus): void {
        if (this.mazeData) {
            this.mazeData.tileStatus[tileIndex] = status;
            if (!this.mazeData.dirty) {
                this.mazeData.dirty = true;
                requestAnimationFrame(this.redraw);
            }
        }
    }

    addListener(listener: MazeRendererListener): void {
        this.listeners.push(listener);
    }

    removeListener(listener: Partial<MazeRendererListener>): void {
        const idx = this.listeners.indexOf(listener);
        if (idx >= 0) this.listeners.splice(idx, 1);
    }

    dispose() {
        this.listeners.splice(0, this.listeners.length);
        const canvas = this.canvas;
        canvas.removeEventListener('click', this.click);
        canvas.removeEventListener('dblclick', this.dblclick);
        canvas.removeEventListener('mousemove', this.mousemove);
        canvas.removeEventListener('mouseenter', this.mousemove);
        canvas.removeEventListener('mouseleave', this.mousemove);
        this.observer.disconnect();
    }

    private resize() {
        const canvas = this.canvas;
        const {clientWidth, clientHeight} = canvas;
        canvas.width = clientWidth;
        canvas.height = clientHeight;
        this.mazeData?.resized();
        this.redraw();
    }

    private readonly redraw = () => {
        const ctx = this.context;
        const {width, height} = this.canvas;
        ctx.clearRect(0, 0, width, height);
        this.renderCells();
        this.renderMaze();
        if (this.mazeData)
            this.mazeData.dirty = false;
    };

    private renderCells(): void {
        const md = this.mazeData;
        if (!md)
            return;
        const {width, height} = md.maze.size;
        const context = this.context;
        const cw = md.fenceWidth, ch = md.fenceHeight;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const status = md?.tileStatus[md.tileIndex(x, y)];
                if (!status)
                    continue;
                context.fillStyle = CanvasMazeRenderer.TILE_COLORS[status];
                context.beginPath()
                context.rect(x * cw, (height - 1 - y) * ch, cw, ch);
                context.fill();
            }
        }
    }

    private renderMaze(): void {
        const ctx = this.context;
        ctx.strokeStyle = CanvasMazeRenderer.FENCE_STROKE_STYLE;
        ctx.lineWidth = CanvasMazeRenderer.FENCE_WIDTH;
        const {width, height} = this.canvas;

        ctx.beginPath();
        ctx.rect(0, 0, width, height);

        const mazeData = this.mazeData;
        if (!mazeData) {
            ctx.stroke();
            return;
        }
        const maze = mazeData.maze;

        const {width: mazeWidth, height: mazeHeight} = maze.size;
        // const fenceWidth = width / mazeWidth
        // const fenceHeight = height / mazeHeight;
        const fenceWidth = mazeData.fenceWidth;
        const fenceHeight = mazeData.fenceHeight;
        let blocked = false;
        const toCanvas = (y: number) => (mazeHeight - y) * fenceHeight;

        for (let y = 0; y < mazeHeight - 1; y++) {
            for (let x = 0; x < mazeWidth; x++) {
                if (maze.isBlocked(x, y, UP)) {
                    if (!blocked) {
                        this.context.moveTo(x * fenceWidth, toCanvas(y + 1));
                        blocked = true;
                    }
                } else if (blocked) {
                    ctx.lineTo(x * fenceWidth, toCanvas(y + 1));
                    blocked = false;
                }
            }
            if (blocked) {
                ctx.lineTo(width, toCanvas(y + 1));
                blocked = false;
            }
        }

        for (let x = 0; x < mazeWidth - 1; x++) {
            for (let y = 0; y < mazeHeight; y++) {
                if (maze.isBlocked(x, y, RIGHT)) {
                    if (!blocked) {
                        this.context.moveTo((x + 1) * fenceWidth, toCanvas(y));
                        blocked = true;
                    }
                } else if (blocked) {
                    ctx.lineTo((x + 1) * fenceWidth, toCanvas(y));
                    blocked = false;
                }
            }
            if (blocked) {
                ctx.lineTo((x + 1) * fenceWidth, 0);
                blocked = false;
            }
        }
        ctx.stroke();
    }

    private readonly click = (e: MouseEvent) => {
        const md = this.mazeData;
        if (!md) return;
        const tileIndex = md.tileIndexAt(e);
        if (tileIndex < 0) return;
        for (const listener of this.listeners) {
            if (listener.tileClicked) listener.tileClicked(tileIndex, e);
        }
    }

    private readonly dblclick = (e: MouseEvent) => {
        const md = this.mazeData;
        if (!md) return;
        const tileIndex = md.tileIndexAt(e);
        if (tileIndex < 0) return;
        for (const listener of this.listeners) {
            if (listener.tileDblClicked) listener.tileDblClicked(tileIndex, e);
        }
    }

    private readonly mousemove = (e: MouseEvent) => {
        const md = this.mazeData;
        if (!md) return;
        const tileIndex = md.tileIndexAt(e);
        const lastTileIndex = md.lastOveredTile;
        if (lastTileIndex === tileIndex)
            return;

        if (lastTileIndex >= 0) {
            for (const listener of this.listeners) {
                if (listener.leaveTile) listener.leaveTile(md.lastOveredTile);
            }
            md.lastOveredTile = -1;
        }

        if (tileIndex >= 0) {
            for (const listener of this.listeners) {
                if (listener.enterTile) listener.enterTile(tileIndex);
            }
            md.lastOveredTile = tileIndex;
        }
    }

}

class MazeData {

    readonly maze: Maze;
    readonly canvas: HTMLCanvasElement;

    readonly tileStatus: Uint8Array;

    private _boundingClientRect = {x: 0, y: 0, width: 0, height: 0};
    private _fenceWidth = 0;
    private _fenceHeight = 0;

    lastOveredTile = -1;
    dirty = true;

    constructor(maze: Maze, canvas: HTMLCanvasElement) {
        this.maze = maze;
        this.canvas = canvas;
        this.tileStatus = new Uint8Array(maze.size.width * maze.size.height);
        this.resized();
    }

    get fenceHeight(): number {
        return this._fenceHeight;
    }

    get fenceWidth(): number {
        return this._fenceWidth;
    }

    resized() {
        const bcr = this.canvas.getBoundingClientRect();
        const {width, height} = this.maze.size;
        this._boundingClientRect = bcr;
        this._fenceWidth = bcr.width / width;
        this._fenceHeight = bcr.height / height;
    }

    tileIndex(x: number, y: number): number {
        return y * this.maze.size.width + x;
    }

    tileIndexAt(e: MouseEvent): number {
        const bcr = this._boundingClientRect;
        const x = Math.floor((e.clientX - bcr.x) / this.fenceWidth);
        const y = Math.floor((bcr.height - 1 - (e.clientY - bcr.y)) / this.fenceHeight);
        if (x >= 0 && x < this.maze.size.width && y >= 0 && y < this.maze.size.height)
            return this.tileIndex(x, y);
        return -1;
    }

}
