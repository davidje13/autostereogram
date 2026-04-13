import { posMod, projectZ } from './helpers.mjs';

const SIMPLIFY = 1e-3;

export function repeatPattern(w, patternW, displayW) {
	const displacement = [];
	if (patternW === displayW) {
		for (let x = 0; x < w; ++x) {
			displacement.push([{ t: 1, v: x % patternW }]);
		}
	} else {
		const xm = patternW / displayW;
		const ixm = displayW / patternW;
		for (let x = 0; x < w; ++x) {
			const patternX0 = x * xm;
			const patternX1 = patternX0 + xm;
			const sources = [];
			for (let i = (patternX0 | 0) + 1; i < patternX1; ++i) {
				sources.push({ t: (i - patternX0) * ixm, v: (i - 1) % patternW });
			}
			sources.push({ t: 1, v: ((patternX1 | 0) - 1) % patternW });
			displacement.push(sources);
		}
	}
	return displacement;
}

export function shiftDisplacement(
	displacement,
	shift,
	modulo = displacement.length,
) {
	shift = Math.round(shift); // currently only supports integer shifts
	if (shift > -SIMPLIFY && shift < SIMPLIFY) {
		return;
	}
	const w = displacement.length;
	for (let x = 0; x < w; ++x) {
		displacement[x] = displacement[x].map(({ t, v }) => ({
			t,
			v: posMod(v + shift, modulo),
		}));
	}
}

export function applyDisplacement(displacement, target, source, y) {
	const w = target.width;
	const sourcePos = y * source.width * 4;
	const targetPos = y * w * 4;
	for (let x = 0; x < w; ++x) {
		let r = 0;
		let g = 0;
		let b = 0;
		let prevT = 0;
		for (const { t, v } of displacement[x]) {
			const m = t - prevT;
			const p = sourcePos + v * 4;
			r += source.data[p] * m;
			g += source.data[p + 1] * m;
			b += source.data[p + 2] * m;
			prevT = t;
		}
		const p = targetPos + x * 4;
		target.data[p] = r;
		target.data[p + 1] = g;
		target.data[p + 2] = b;
	}
}

export function getFinalShift(displacement) {
	const final = displacement[displacement.length - 1];
	const finalT = 1 - (final[final.length - 2]?.t ?? 0);
	const finalV = final[final.length - 1].v;
	return finalV + finalT;
}

export function applyAutoStereogram(
	displacement,
	rayTrace,
	projectToView,
	deprojectX,
	eyeL,
	eyeR,
	integerDisplacement = false,
) {
	const w = displacement.length;
	const eyeLView = [];
	const eyeRView = [];
	for (let x = 0; x < w; ++x) {
		const screen = projectToView(x);
		eyeLView.push(rayTrace(eyeL, screen).x);
		eyeRView.push(rayTrace(eyeR, screen).x);
	}
	const screenZ = projectToView(0).z;
	for (let x = 0; x < w; ++x) {
		let modelL = eyeLView[x];
		let modelR;
		const screenR = projectZ(eyeR, modelL, screenZ);
		let xS = deprojectX(screenR.x);
		if (xS > x || xS < 0) {
			modelR = eyeRView[x];
			const screenL = projectZ(eyeL, modelR, 0);
			xS = deprojectX(screenL.x);
			//modelL = eyeLView[Math.round(xS)];
			//} else {
			//modelR = eyeRView[Math.round(xS)];
		}
		if (xS < x && xS >= 0 && xS <= w - 1) {
			// && Math.abs(modelR - modelL) < 1e-15) {
			if (integerDisplacement) {
				displacement[x] = displacement[Math.round(xS)];
			} else {
				displacement[x] = findBlend(displacement, xS);
			}
		}
	}
}

export function generateAutoStereogramDisplacements(
	w,
	h,
	patternW,
	baseRepeat,
	rayTrace,
	projectToView,
	deprojectX,
	eyeL,
	eyeR,
	{
		patternAlignment = 0,
		integerDisplacement = false,
		patternAlignmentSteps = 1,
	} = {},
) {
	const rows = [];
	let prevShift = 0;
	const shiftStep = patternW / patternAlignmentSteps;
	for (let y = 0; y < h; ++y) {
		const displacement = repeatPattern(w, patternW, baseRepeat);

		applyAutoStereogram(
			displacement,
			rayTrace,
			(x) => projectToView(x, y),
			deprojectX,
			eyeL,
			eyeR,
			integerDisplacement,
		);

		if (patternAlignment) {
			let shift = -getFinalShift(displacement) * patternAlignment;
			if (y) {
				const delta = posMod(shift - prevShift, patternW) - patternW / 2;
				shift -= Math.round(delta / shiftStep) * shiftStep + patternW / 2;
			}
			shiftDisplacement(displacement, shift, patternW);
			prevShift = shift;
		}
		rows.push(displacement);
	}
	return rows;
}

export function limitSources(displacement, limit) {
	for (let i = 0; i < displacement.length; ++i) {
		let blend = displacement[i];
		if (blend.length > limit) {
			const sizes = blend.map((s, i) => ({ w: s.pt - s.t, i }));
			sizes.sort((a, b) => b.w - a.w);
			const keep = new Array(blend.length).fill(0);
			for (let i = 0; i < limit; ++i) {
				keep[sizes[i].i] = 1;
			}
			blend = blend.filter((_, i) => keep[i]);
			blend[blend.length - 1].t = 1;
			displacement[i] = blend;
		}
	}
}

function findBlend(sources, begin) {
	const blend = [];
	let prev = { t: 0, pt: 0, v: -1 };
	for (let xL = begin | 0; ; ++xL) {
		for (const s of sources[xL]) {
			const t = s.t + xL - begin;
			if (t >= 1 - SIMPLIFY) {
				if (s.v === prev.v) {
					prev.t = 1;
				} else {
					blend.push({ t: 1, pt: prev.t, v: s.v });
				}
				return blend;
			}
			if (t > prev.t + SIMPLIFY) {
				if (s.v === prev.v) {
					prev.t = t;
				} else {
					prev = { t, pt: prev.t, v: s.v };
					blend.push(prev);
				}
			}
		}
	}
}
