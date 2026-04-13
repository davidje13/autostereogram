import { projectZ } from './helpers.mjs';
import { pt3Dist2, pt3Dot, pt3Len2, pt3Mad, pt3Sub } from './Pt3.mjs';

export const rayTrace = (nearZ, farZ) => (from, to) => {
	// test scene: ball in front of infinite plane
	const ball = { x: 0, y: 0, z: farZ };
	const ballR = farZ - nearZ;

	// closest point on line
	const lineD = pt3Sub(to, from);
	const lineDL2 = pt3Len2(lineD);
	const c = pt3Mad(lineD, pt3Dot(pt3Sub(ball, from), lineD) / lineDL2, from);
	// ball intersections
	const s = ballR * ballR - pt3Dist2(ball, c);
	if (s >= 0) {
		const p = pt3Mad(lineD, -Math.sqrt(s / lineDL2), c);
		if (p.z < farZ) {
			return p;
		}
	}
	return projectZ(from, to, farZ);
};
