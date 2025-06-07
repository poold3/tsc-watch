# tsc-compiler

A simple TypeScript compiler that watches for file changes and allows for custom JavaScript hooks to be run before and after compilation. The hooks run synchronously using `execFileSync()`.

## CLI Options

| Option   | Value               | Description                                                             |
| :------- | :------------------ | :---------------------------------------------------------------------- |
| `--root` | `./path/to/root`    | The directory that contains the `tsconfig.json` file. Defaults to `./`. |
| `--pre`  | `./path/to/pre.js`  | The `.js` file to be executed before compilation.                       |
| `--post` | `./path/to/post.js` | The `.js` file to be run after compilation.                             |
