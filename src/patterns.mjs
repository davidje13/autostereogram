export function rect(
	output,
	r,
	g,
	b,
	x0 = 0,
	y0 = 0,
	x1 = output.width,
	y1 = output.height,
) {
	const step = output.width;
	for (let y = y0; y < y1; ++y) {
		for (let x = x0; x < x1; ++x) {
			const p = (y * step + x) * 4;
			output.data[p] = r;
			output.data[p + 1] = g;
			output.data[p + 2] = b;
		}
	}
}

export function gradient(
	output,
	r0,
	g0,
	b0,
	r1,
	g1,
	b1,
	x0 = 0,
	y0 = 0,
	x1 = output.width,
	y1 = output.height,
) {
	const step = output.width;
	for (let x = x0; x < x1; ++x) {
		const f = (x - x0) / (x1 - x0);
		const r = r0 * (1 - f) + r1 * f;
		const g = g0 * (1 - f) + g1 * f;
		const b = b0 * (1 - f) + b1 * f;
		for (let y = y0; y < y1; ++y) {
			const p = (y * step + x) * 4;
			output.data[p] = r;
			output.data[p + 1] = g;
			output.data[p + 2] = b;
		}
	}
}

export function checker(output, checkerSize, r, g, b) {
	const w = output.width;
	const h = output.height;
	const step = w;
	for (let y = 0; y < h; ++y) {
		for (let x = 0; x < w; ++x) {
			if (((x / checkerSize) % 1 >= 0.5) ^ ((y / checkerSize) % 1 >= 0.5)) {
				const p = (y * step + x) * 4;
				output.data[p] = r;
				output.data[p + 1] = g;
				output.data[p + 2] = b;
			}
		}
	}
}

export function randomNoise(
	output,
	x0 = 0,
	y0 = 0,
	x1 = output.width,
	y1 = output.height,
) {
	const step = output.width;
	for (let y = y0; y < y1; ++y) {
		for (let x = x0; x < x1; ++x) {
			const p = (y * step + x) * 4;
			output.data[p] = Math.random() * 256;
			output.data[p + 1] = Math.random() * 256;
			output.data[p + 2] = Math.random() * 256;
		}
	}
}

export function perlinNoise(output, levels, weight) {
	const w = output.width;
	const h = output.height;
	const step = w;
	randomNoise(output, 0, 0, w >>> levels, h >>> levels);
	const s = 256 * (1 - weight);
	for (let l = levels; l--; ) {
		for (let y = h >>> l, yb = 0; y-- > 0; ) {
			const ya = y >>> 1;
			for (let x = w >>> l, xb = 0; x-- > 0; ) {
				const xa = x >>> 1;
				let r = output.data[(ya * step + xa) * 4];
				let g = output.data[(ya * step + xa) * 4 + 1];
				let b = output.data[(ya * step + xa) * 4 + 2];
				if (x & 1) {
					r += output.data[(ya * step + xb) * 4];
					g += output.data[(ya * step + xb) * 4 + 1];
					b += output.data[(ya * step + xb) * 4 + 2];
				}
				if (y & 1) {
					r += output.data[(yb * step + xa) * 4];
					g += output.data[(yb * step + xa) * 4 + 1];
					b += output.data[(yb * step + xa) * 4 + 2];
					if (x & 1) {
						r += output.data[(yb * step + xb) * 4];
						g += output.data[(yb * step + xb) * 4 + 1];
						b += output.data[(yb * step + xb) * 4 + 2];
					}
					r /= 2;
					g /= 2;
					b /= 2;
				}
				if (x & 1) {
					r /= 2;
					g /= 2;
					b /= 2;
				}
				const p = (y * step + x) * 4;
				output.data[p] = r * weight + Math.random() * s;
				output.data[p + 1] = g * weight + Math.random() * s;
				output.data[p + 2] = b * weight + Math.random() * s;
				xb = xa;
			}
			yb = ya;
		}
	}
}

export function boostContrast(
	output,
	multiplier,
	shift = 128 * (1 - multiplier),
) {
	const s = output.width * output.height;
	for (let i = 0; i < s; ++i) {
		const p = i * 4;
		output.data[p] = output.data[p] * multiplier + shift;
		output.data[p + 1] = output.data[p + 1] * multiplier + shift;
		output.data[p + 2] = output.data[p + 2] * multiplier + shift;
	}
}
