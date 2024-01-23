import { Symbol } from "../models/Symbol";
import { getDate } from "../utils/getDate";

export const checkForTrades = async ({
	readySymbols,
}: {
	readySymbols: Symbol[];
}) => {
	console.log("");
	console.log(getDate({}).dateString);

	console.log("Checking for trades in  " + readySymbols.length + " symbols");
	console.log(
		readySymbols
			.map(
				(s) =>
					s.pair +
					" " +
					getDate({ date: s.candlestick[s.candlestick.length - 1].openTime })
						.dateString
			)
			.join(", ")
	);
	console.log(getDate({}).dateString);
};
