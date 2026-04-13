import {
	generateAutoStereogramDisplacements,
	limitSources,
} from './displacement.mjs';
import { rayTrace } from './scene.mjs';

self.addEventListener(
	'message',
	({
		data: {
			displacementBuffer,
			width,
			height,
			scale,
			patternW,
			baseRepeat,
			nearZ,
			farZ,
			eyeL,
			eyeR,
			integerDisplacement = true,
			patternAlignment = 0,
			patternAlignmentSteps = 1,
			maxSamples = 1,
		},
	}) => {
		const tm0 = performance.now();
		const displacements = new Int16Array(
			displacementBuffer,
			0,
			width * height * maxSamples,
		);
		const displacementWeights = new Uint8Array(
			displacementBuffer,
			width * height * maxSamples * Int16Array.BYTES_PER_ELEMENT,
			width * height * maxSamples,
		);

		const dx = width * 0.5 * scale;
		const dy = height * 0.5 * scale;
		const iscale = 1 / scale;
		const projectToView = (x, y) => ({
			x: x * scale - dx,
			y: y * scale - dy,
			z: 0,
		});
		const deprojectX = (x) => (x + dx) * iscale;

		const rows = generateAutoStereogramDisplacements(
			width,
			height,
			patternW,
			baseRepeat,
			rayTrace(nearZ, farZ),
			projectToView,
			deprojectX,
			eyeL,
			eyeR,
			{ patternAlignment, integerDisplacement, patternAlignmentSteps },
		);
		for (const row of rows) {
			limitSources(row, 4);
		}
		for (let y = 0; y < height; ++y) {
			const row = rows[y];
			for (let x = 0; x < width; ++x) {
				const p = (y * width + x) * maxSamples;
				let prevT = 0;
				let i = 0;
				for (const sample of row[x]) {
					displacements[p + i] = sample.v;
					displacementWeights[p + i] = Math.min(
						((sample.t - prevT) * 256) | 0,
						255,
					);
					prevT = sample.t;
					++i;
				}
				for (; i < maxSamples; ++i) {
					displacementWeights[p + i] = 0;
				}
			}
		}
		const tm1 = performance.now();
		self.postMessage({ time: (tm1 - tm0) * 0.001 });
	},
);
