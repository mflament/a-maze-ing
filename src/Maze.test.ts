import {describe, expect, test} from '@jest/globals';
import {type Direction, DOWN, LEFT, Maze, RIGHT, UP} from "./Maze.ts";

describe('Maze module', () => {

    test('test corners', () => {
        const m = new Maze({width: 2, height: 2});
        expect(m.isBlocked(0, 0, UP)).toBe(false);
        expect(m.isBlocked(0, 0, RIGHT)).toBe(false);
        expect(m.isBlocked(0, 0, DOWN)).toBe(true);
        expect(m.isBlocked(0, 0, LEFT)).toBe(true);

        expect(m.isBlocked(1, 0, UP)).toBe(false);
        expect(m.isBlocked(1, 0, RIGHT)).toBe(true);
        expect(m.isBlocked(1, 0, DOWN)).toBe(true);
        expect(m.isBlocked(1, 0, LEFT)).toBe(false);

        expect(m.isBlocked(0, 1, UP)).toBe(true);
        expect(m.isBlocked(0, 1, RIGHT)).toBe(false);
        expect(m.isBlocked(0, 1, DOWN)).toBe(false);
        expect(m.isBlocked(0, 1, LEFT)).toBe(true);


        expect(m.isBlocked(1, 1, UP)).toBe(true);
        expect(m.isBlocked(1, 1, RIGHT)).toBe(true);
        expect(m.isBlocked(1, 1, DOWN)).toBe(false);
        expect(m.isBlocked(1, 1, LEFT)).toBe(false);
    });

    test('test set blocked', () => {
        const m = new Maze({width: 2, height: 2});
        m.setBlocked(0, 0, RIGHT, true);
        expect(m.isBlocked(0, 0, RIGHT)).toBe(true);
        expect(m.isBlocked(1, 0, LEFT)).toBe(true);

        m.setBlocked(1, 1, DOWN, true);
        expect(m.isBlocked(1, 0, UP)).toBe(true);
        expect(m.isBlocked(1, 1, DOWN)).toBe(true);

        m.clear();
        expect(m.isBlocked(0, 0, RIGHT)).toBe(false);
        expect(m.isBlocked(1, 0, LEFT)).toBe(false);
        expect(m.isBlocked(1, 0, UP)).toBe(false);
        expect(m.isBlocked(1, 1, DOWN)).toBe(false);
    });

    test('test set invalid fence', () => {
        const m = new Maze({width: 2, height: 2});
        expect(() => m.setBlocked(0, 0, LEFT, true)).toThrow(Error);
        expect(() => m.setBlocked(0, 0, DOWN, true)).toThrow(Error);
        expect(() => m.setBlocked(1, 0, RIGHT, true)).toThrow(Error);
        expect(() => m.setBlocked(1, 0, DOWN, true)).toThrow(Error);

        expect(() => m.setBlocked(0, 1, LEFT, true)).toThrow(Error);
        expect(() => m.setBlocked(0, 1, UP, true)).toThrow(Error);
        expect(() => m.setBlocked(1, 1, RIGHT, true)).toThrow(Error);
        expect(() => m.setBlocked(1, 1, UP, true)).toThrow(Error);
    });

    test('test all clear', () => {
        const m = new Maze({width: 10, height: 10});
        const {width, height} = m.size;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                checkBlocked(m, x, y, UP, y >= height - 1);
                checkBlocked(m, x, y, RIGHT, x >= width - 1);
                checkBlocked(m, x, y, DOWN, y === 0);
                checkBlocked(m, x, y, LEFT, x === 0);
            }
        }
    });

    test('test all blocked', () => {
        const m = new Maze({width: 10, height: 10});
        m.fences.fill(0xFF);

        for (let y = 0; y < m.size.height; y++) {
            for (let x = 0; x < m.size.width; x++) {
                checkBlocked(m, x, y, UP, true);
                checkBlocked(m, x, y, RIGHT, true);
                checkBlocked(m, x, y, DOWN, true);
                checkBlocked(m, x, y, LEFT, true);
            }
        }
    });

    function checkBlocked(maze: Maze, x: number, y: number, dir: Direction, expected: boolean) {
        try {
            expect(maze.isBlocked(x, y, dir)).toBe(expected);
        } catch (error) {
            throw new Error(`Error at [${x},${y},${directionName(dir)}] : ${error}`);
        }
    }

    function directionName(dir: Direction): string {
        switch (dir) {
            case UP:
                return 'up';
            case RIGHT:
                return 'right';
            case DOWN:
                return 'down';
            case LEFT:
                return 'left';
        }
    }

});