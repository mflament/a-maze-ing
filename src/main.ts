import "./index.scss"
import {
    type MazeGenerator,
    type MazeGeneratorResult,
    RandomizedDepthFirstMazeGenerator,
    TestMazeGenerator,
    WilsonMazeGenerator
} from "./generator";
import {Maze, type Size} from "./Maze.ts";
import {type MazeRenderer, NONE, PATH} from "./MazeRenderer.ts";
import {sleep} from "./Utils.ts";
import {CanvasMazeRenderer} from "./CanvasMazeRenderer.ts";
import {PathLookupHandler} from "./PathLookupHandler.ts";
import {
    BreadthFirstMazeSolver,
    CANCELED,
    CONTINUE,
    DepthFirstMazeSolver,
    type MazeSolver,
    RandomDepthFirstMazeSolver,
    SOLVE,
    type SolverProgressCallback,
} from "./solver";

const MIN_SPEED = 512;

type Elements = {
    canvas: HTMLCanvasElement,

    keys: HTMLElement | null,

    info: HTMLElement | null,
    generator: HTMLElement | null,
    solver: HTMLElement | null,
    seed: HTMLElement | null,
    path_length: HTMLElement | null,
};

function createDom(): Elements {
    const canvas = document.getElementById('maze-canvas');
    if (!(canvas instanceof HTMLCanvasElement)) throw new Error(`${canvas} is not instanceof HTMLCanvasElement`);
    const keys = document.getElementById('keys');
    const info = document.getElementById('info');
    const generator = document.getElementById('generator-name');
    const solver = document.getElementById('solver-name');
    const seed = document.getElementById('seed');
    const path_length = document.getElementById('path_length');
    return {canvas, keys, info, generator, solver, seed, path_length};
}

async function generateMaze(generator: MazeGenerator, size: Size, renderer: MazeRenderer,
                            cancelled?: () => boolean): Promise<MazeGeneratorResult | undefined> {
    if (cancelled) {
        let maze: Maze | undefined, update = false, done = false, result: MazeGeneratorResult | undefined;
        generator.generate(size, async m => {
            maze = m;
            update = true;
            await sleep(6);
            return !cancelled();
        }).then(r => {
            result = r;
            if (r) maze = r.maze;
            update = true;
            done = true;
        });
        return new Promise(resolve => {
            const renderLoop = () => {
                if (update && maze)
                    renderer.maze = maze;
                if (!done)
                    requestAnimationFrame(renderLoop);
                else
                    resolve(result);
            };
            requestAnimationFrame(renderLoop);
        });
    } else {
        return generator.generate(size);
    }
}

function createGenerators(seed?: number): MazeGenerator[] {
    return [
        new RandomizedDepthFirstMazeGenerator(seed),
        new WilsonMazeGenerator(seed),
        new TestMazeGenerator(seed),
    ];
}

function createSolvers(renderer: MazeRenderer, seed?: number): MazeSolver[] {
    return [
        new DepthFirstMazeSolver(renderer),
        new RandomDepthFirstMazeSolver(renderer, seed),
        new BreadthFirstMazeSolver(renderer),
    ];
}

type MazeState = {
    generator: MazeGenerator;

    promise?: Promise<unknown>;
    cancelled: boolean;
    maze?: Maze;

    solver: MazeSolver;
    renderSpeed: number;

    info: boolean;
};

function start(size: Size, seed?: number) {
    const {canvas, keys, info, generator, solver, seed: seedElement, path_length} = createDom();
    const renderer = new CanvasMazeRenderer(canvas);
    const generators = createGenerators(seed);
    const solvers = createSolvers(renderer, seed);
    const pathLookupHandler = new PathLookupHandler(renderer);

    const state: MazeState = {
        generator: generators[0],
        solver: solvers[0],
        renderSpeed: 16,
        cancelled: false,
        info: false
    };

    if (keys)
        createDoc(keys);

    const generate = (show = false) => {
        if (state.promise) {
            if (state.cancelled) return; // already cancelled
            state.cancelled = true;
            state.promise.then(() => generate(show));
        } else {
            state.cancelled = false;
            renderer.removeListener(pathLookupHandler);
            state.maze = undefined;
            state.promise = generateMaze(state.generator, size, renderer, show ? () => state.cancelled : undefined)
                .then(result => {
                    state.promise = undefined;
                    if (result) {
                        const maze = result.maze;
                        state.maze = maze;
                        renderer.maze = maze;
                        if (seedElement) seedElement.innerText = result.seed.toString();
                        renderer.addListener(pathLookupHandler);

                        pathLookupHandler.start = 0;
                        pathLookupHandler.exit = maze.size.width * maze.size.height - 1;
                    } else {
                        state.maze = undefined;
                        renderer.maze = undefined;
                    }
                })
                .catch(e => console.error(e));
        }
    }

    const solve = async () => {
        if (!state.maze) return;
        if (state.promise) {
            if (state.cancelled) return; // already cancelled
            state.cancelled = true;
            await state.promise;
        }

        state.cancelled = false;
        await clearTiles();

        const {start, exit} = pathLookupHandler;
        let progressCallback: SolverProgressCallback | undefined = undefined;
        if (state.renderSpeed >= 0) {
            progressCallback = async () => {
                if (state.cancelled) return CANCELED;
                if (state.renderSpeed < 0) return SOLVE;
                await sleep(state.renderSpeed);
                return CONTINUE;
            };
        }
        const promise = state.solver.solve(state.maze, start, exit, progressCallback);
        state.promise = promise;

        const mazePath = await promise;
        state.promise = undefined;
        if (mazePath) {
            for (const p of mazePath) {
                if (p !== start && p !== exit)
                    renderer.setTileStatus(p, PATH);
            }
            if (path_length) path_length.innerText = (mazePath.length - 1).toString();
        }
    }

    const resolve = async () => {
        if (!state.maze) return;
        const rs = state.renderSpeed;
        state.renderSpeed = -1;
        if (state.promise) await state.promise;
        await solve();
        state.renderSpeed = rs;
    }

    const clearTiles = async () => {
        if (!state.maze) return;
        if (state.promise) await resolve();
        const tileCount = state.maze.size.width * state.maze.size.height;
        const {start, exit} = pathLookupHandler;
        for (let i = 0; i < tileCount; i++) {
            if (i !== start && i !== exit) renderer.setTileStatus(i, NONE);
        }
        if (path_length) path_length.innerText = "";
        await sleep(0);
    }

    const setGenerator = (i: number) => {
        state.generator = generators[i];
        if (generator)
            generator.innerText = state.generator.name;
        generate();
    }

    const setSolver = (i: number) => {
        state.solver = solvers[i];
        if (solver)
            solver.innerText = state.solver.name;
    }

    const toggleInfo = () => {
        if (info) {
            state.info = !state.info;
            info.style.display = state.info ? 'none' : 'block';
        }
    }

    const increaseSpeed = () => {
        if (state.renderSpeed === undefined) return;
        state.renderSpeed = state.renderSpeed >> 1;
    }

    const decreaseSpeed = () => {
        if (state.renderSpeed === undefined) return;
        state.renderSpeed = state.renderSpeed === 0 ? 4 : Math.min(MIN_SPEED, state.renderSpeed << 1);
    }

    const keydown = (e: KeyboardEvent) => {
        if (e.key === 'g') generate();
        else if (e.key === 'G') generate(true);
        else if (e.key === 's') solve();
        else if (e.key === 'c') clearTiles().catch(e => console.error(e));
        else if (e.key === 'd') toggleInfo();
        else if (e.key === '+') increaseSpeed();
        else if (e.key === '-') decreaseSpeed();
        else if (e.key === ' ') resolve();
        else if (!e.shiftKey) {
            if (e.code === 'Digit1') setSolver(0)
            else if (e.code === 'Digit2') setSolver(1);
            else if (e.code === 'Digit3') setSolver(2);
        } else {
            if (e.code === 'Digit1') setGenerator(0);
            else if (e.code === 'Digit2') setGenerator(1);
            else if (e.code === 'Digit3') setGenerator(2);
        }
    }

    window.addEventListener('keydown', keydown);

    setGenerator(0);
    setSolver(0);

    generate();
}

type KeyBinding = { code: string, doc: string };
const keyBindings: KeyBinding[] = [
    {code: 'g', doc: 'Generate'},
    {code: 'G', doc: 'Generate (show)'},
    {code: 's', doc: 'Solve'},
    {code: 'c', doc: 'Clear'},
    {code: 'd', doc: 'Toggle'},
    {code: '+', doc: 'Increase'},
    {code: '-', doc: 'Decrease'},
    {code: 'space', doc: 'Skip'},
    {code: '1, 2, 3', doc: 'Change solver'},
    {code: 'shift + 1, 2, 3', doc: 'Change generator'},
]

function createDoc(target: HTMLElement) {
    for (const key of keyBindings) {
        const li = document.createElement('li');
        const code = document.createElement('code');
        code.innerText = key.code;
        li.appendChild(code);

        const doc = document.createElement('div');
        doc.className = 'doc';
        doc.innerText = key.doc;
        li.appendChild(doc);

        target.appendChild(li);
    }
}

// const MAZE_SIZE = {width: 10, height: 10};
// const MAZE_SIZE = {width: 20, height: 20};
// const MAZE_SIZE = {width: 40, height: 40};
// const MAZE_SIZE = {width: 60, height: 60};
// const MAZE_SIZE = {width: 80, height: 80};
// const MAZE_SIZE = {width: 100, height: 100};
// const MAZE_SIZE = {width: 120, height: 120};
const MAZE_SIZE = {width: 160, height: 160};
 // const MAZE_SIZE = {width: 180, height: 180};
// const MAZE_SIZE = {width: 200, height: 200};

const SEED = undefined;
// const SEED = 1706200766;

start(MAZE_SIZE, SEED);
