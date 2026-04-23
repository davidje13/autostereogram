import { ceilTo, roundTo } from './helpers.mjs';
import { boostContrast, perlinNoise } from './patterns.mjs';

const dpr = 1; //Math.min(window.devicePixelRatio, 2);
const width = window.innerWidth * dpr;
const height = window.innerHeight * dpr;

const canvas = document.createElement('canvas');
canvas.width = width;
canvas.height = height;
canvas.style.position = 'absolute';
canvas.style.top = '0';
canvas.style.left = '0';
canvas.style.width = '100%';
canvas.style.height = '100%';
document.body.append(canvas);
const ctx = canvas.getContext('2d');

// x/y minimum bounds: -1 to 1 (total range 2)
// negative z = above page (cross eyed viewing)
// positive z = below page (parallel eyes viewing)
//const nearZ = 0.5;
//const farZ = 1.7;
const nearZ = -1.0;
const farZ = -0.8;

const perlinLevel = 3 + Math.round(Math.log2(dpr));
const patternStep = 1 << perlinLevel;

const eyeSepMM = 60;
const eye = { x: 0, y: 0, z: -2 };

const scale = 2 / Math.min(width, height);
const eyeSepPx = eyeSepMM * ((96 * dpr) / 25.4);
const eyeSep = eyeSepPx * scale;

const baseRepeatTarget = eyeSepPx * (farZ / (eye.z - farZ));
const baseRepeat = Math.max(
	roundTo(baseRepeatTarget, patternStep),
	patternStep,
);
eye.z = farZ * ((eyeSepPx * (farZ > 0 ? -1 : 1)) / baseRepeat + 1);

const eyeL = { x: eye.x - eyeSep * 0.5, y: eye.y, z: eye.z };
const eyeR = { x: eye.x + eyeSep * 0.5, y: eye.y, z: eye.z };

const patternW = ceilTo(baseRepeat, patternStep);
const pattern = ctx.createImageData(patternW, ceilTo(height, patternStep));
for (let i = 0; i < patternW * height; ++i) {
	pattern.data[i * 4 + 3] = 255;
}

const dat = ctx.createImageData(width, height);
for (let i = 0; i < width * height; ++i) {
	dat.data[i * 4 + 3] = 255;
}

// Depth Map
//for (let y = 0; y < height; ++y) {
//	for (let x = 0; x < width; ++x) {
//		const screen = projectToView(x, y);
//		const model = rayTrace(eye, screen);
//		const depth = 256 * ((model.z - farZ) / (nearZ - farZ));
//		const p = (y * width + x) * 4;
//		dat.data[p] = depth;
//		dat.data[p + 1] = depth;
//		dat.data[p + 2] = depth;
//	}
//}

// Base Image
//gradient(pattern, 255, 255, 0, 255, 0, 255);
//randomNoise(pattern);
perlinNoise(pattern, perlinLevel, 0.7);
//checker(pattern, patternW / 4, 255, 255, 255);
//rect(pattern, 0, 0, 0, 0, 0, 2, height);

boostContrast(pattern, 2);

const maxSamples = 4;
const displacementBuffer = new SharedArrayBuffer(
	width *
		height *
		(Int16Array.BYTES_PER_ELEMENT + Uint8Array.BYTES_PER_ELEMENT) *
		maxSamples,
);

const worker = new Worker('/worker.mjs', { type: 'module' });
worker.addEventListener('error', (e) => {
	console.error('worker error', e.error);
});
worker.addEventListener('message', (e) => {
	const { time } = e.data;
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
	for (let y = 0; y < height; ++y) {
		const sourcePos = y * patternW * 4;
		const p = y * width * 4;
		for (let x = 0; x < width; ++x) {
			let r = 0;
			let g = 0;
			let b = 0;
			const pp = p + x * 4;
			for (let i = 0; i < maxSamples; ++i) {
				const v = sourcePos + displacements[pp + i] * 4;
				const m = displacementWeights[pp + i];
				r += pattern.data[v] * m;
				g += pattern.data[v + 1] * m;
				b += pattern.data[v + 2] * m;
			}
			dat.data[pp] = r * (1 / 255);
			dat.data[pp + 1] = g * (1 / 255);
			dat.data[pp + 2] = b * (1 / 255);
		}
	}
	ctx.putImageData(dat, 0, 0);
	console.log('time', time);
});

worker.postMessage({
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
	integerDisplacement: false,
	patternAlignment: 0.5, // 0 = left, 1 = right
	patternAlignmentSteps: 8,
	maxSamples,
});
