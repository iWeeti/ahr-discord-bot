import { Options } from "tsup";

const options: Options = {
    entry: ["src/index.ts"],
    clean: true,
    outDir: "dist",
    sourcemap: true,
};

export default options;
