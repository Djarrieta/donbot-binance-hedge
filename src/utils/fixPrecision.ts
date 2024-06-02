import Big from "big.js";

export type FixPrecisionProps = {
	value: number;
	precision: number;
};

export const fixPrecision = ({ value, precision }: FixPrecisionProps) => {
	let result = "0";
	if (Math.abs(value) === Infinity) return result;

	const valueDec = new Big(value || 0);

	result = valueDec.round(precision, 3).toFixed();
	return result;
};
