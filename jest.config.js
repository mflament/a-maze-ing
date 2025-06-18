import {createJsWithTsPreset} from "ts-jest"

const tsJestTransformCfg = createJsWithTsPreset({
  tsconfig: 'tsconfig.test.json'
}).transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "jsdom",
  transform: {
    ...tsJestTransformCfg,
  }
};