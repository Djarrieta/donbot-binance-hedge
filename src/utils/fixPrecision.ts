import Big from "big.js";

interface FixPrecisionProps {
	value: number;
	precision: number;
}

export const fixPrecision = ({ value, precision }: FixPrecisionProps) => {
	let result = "";

	const valueDec = new Big(value);

	result = valueDec.round(precision, 3).toFixed();
	return result;
};
