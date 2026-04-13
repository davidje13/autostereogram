export const pt3Dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
export const pt3Cross = (a, b) => ({
	x: a.y * b.z - a.z * b.y,
	y: a.z * b.x - a.x * b.z,
	z: a.x * b.y - a.y * b.x,
});
export const pt3Reflect = (v, surfaceNorm) =>
	pt3Mad(surfaceNorm, -2 * pt3Dot(v, surfaceNorm), v);

export const pt3Len2 = ({ x, y, z }) => x * x + y * y + z * z;
export const pt3Len = ({ x, y, z }) => Math.hypot(x, y, z);

export const pt3Dist2 = (a, b) =>
	(a.x - b.x) * (a.x - b.x) +
	(a.y - b.y) * (a.y - b.y) +
	(a.z - b.z) * (a.z - b.z);
export const pt3Dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

export const pt3Norm = (pt, length = 1) => pt3Mul(pt, length / pt3Len(pt));

export const pt3Angle = (a, b) =>
	Math.acos(
		Math.max(
			-1,
			Math.min(1, pt3Dot(a, b) / Math.sqrt(pt3Len2(a) * pt3Len2(b))),
		),
	);

export const pt3Add = (a, b) => ({
	x: a.x + b.x,
	y: a.y + b.y,
	z: a.z + b.z,
});
export const pt3Mul = (pt, m) => ({
	x: pt.x * m,
	y: pt.y * m,
	z: pt.z * m,
});
export const pt3Mad = (a, m, b) => ({
	x: a.x * m + b.x,
	y: a.y * m + b.y,
	z: a.z * m + b.z,
});
export const pt3Sub = (a, b) => ({
	x: a.x - b.x,
	y: a.y - b.y,
	z: a.z - b.z,
});

export const pt3Lerp = (a, b, t) => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	z: a.z + (b.z - a.z) * t,
});

export const pt3Mid = (a, b) => ({
	x: (a.x + b.x) * 0.5,
	y: (a.y + b.y) * 0.5,
	z: (a.z + b.z) * 0.5,
});
