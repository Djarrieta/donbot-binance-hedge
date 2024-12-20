import { LogServiceFirebase } from "./infrastructure/LogServiceFirebase";

const logService = new LogServiceFirebase();

logService.showLogs({
	start: 0,
	end: Date.now(),
});
