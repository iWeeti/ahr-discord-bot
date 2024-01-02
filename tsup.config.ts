import { Options } from "tsup";

const options: Options = {
    entry: ["src/index.tsx"],
    clean: true,
    outDir: "dist",
    sourcemap: true,
};

export default options;
