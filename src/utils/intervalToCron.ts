import { Interval } from "../domain/Interval";

export function intervalToCron(interval: Interval): string {
	switch (interval) {
		case Interval["1m"]:
			return "*/1 * * * *";
		case Interval["3m"]:
			return "*/3 * * * *";
		case Interval["5m"]:
			return "*/5 * * * *";
		case Interval["15m"]:
			return "*/15 * * * *";
		case Interval["30m"]:
			return "*/30 * * * *";
		case Interval["1h"]:
			return "1 */1 * * *";
		case Interval["2h"]:
			return "1 */2 * * *";
		case Interval["4h"]:
			return "1 */4 * * *";
		case Interval["8h"]:
			return "1 */8 * * *";
		case Interval["12h"]:
			return "1 */12 * * *";
		case Interval["1d"]:
			return "1 0 * * *";
		default:
			throw new Error(`intervalToCron: interval ${interval} is not supported`);
	}
}
