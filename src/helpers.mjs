import { pt3Mad, pt3Sub } from './Pt3.mjs';

export const projectZ = (from, to, targetZ) =>
	pt3Mad(pt3Sub(to, from), (targetZ - from.z) / (to.z - from.z), from);

export const posMod = (a, b) => ((a % b) + b) % b;

export const roundTo = (a, b) => Math.round(a / b) * b;
export const ceilTo = (a, b) => Math.ceil(a / b) * b;
