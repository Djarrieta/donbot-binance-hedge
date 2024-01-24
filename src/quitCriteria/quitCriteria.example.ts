import { Interval } from "../models/Interval";
import { QuitStrategy, QuitStrategyResponse } from "../models/QuitStrategy";

const stg: QuitStrategy = {
	name: "exit_stg_name",
	lookBackLength: Interval["1d"] / Interval["5m"],
	interval: Interval["5m"],
	validate: ({ candlestick, pair, side }) => {
		const response: QuitStrategyResponse = {
			shouldQuit: false,
		};

		if (candlestick.length < Interval["1d"] / Interval["5m"]) return response;

		//Add your exit strategy here modifying shouldExit
		let condition = false;

		if (condition) {
			response.shouldQuit = true;
		}
		if (condition) {
			response.shouldQuit = true;
		}

		return response;
	},
};

export default stg;
