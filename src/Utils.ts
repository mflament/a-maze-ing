export interface PRNG {
    readonly seed: number;

    next(): number;
}

export function mulberry32(seed?: number): PRNG {
    let a = seed !== undefined ? seed : Math.floor(Math.random() * 0xFFFFFFFF);
    return {
        get seed(): number {
            return a;
        },
        next(): number {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
}

export function toCSS(color: number) {
    let s = '#';
    for (let i = 7; i >= 0; i--) {
        const b = (color >> (i * 4)) & 0xF;
        s += b.toString(16).toUpperCase();
    }
    return s;
}


export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
