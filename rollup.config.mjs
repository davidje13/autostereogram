import { nodeResolve } from '@rollup/plugin-node-resolve';

export default [
	{
		input: 'web/src/index.mjs',
		output: { file: 'build/static/index.mjs', format: 'esm' },
		plugins: [nodeResolve()],
	},
	{
		input: 'web/src/worker.mjs',
		output: { file: 'build/static/worker.mjs', format: 'esm' },
		plugins: [nodeResolve()],
	},
];
