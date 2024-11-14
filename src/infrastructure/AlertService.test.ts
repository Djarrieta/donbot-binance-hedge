import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { unlinkSync } from "fs";
import type { Alert } from "../domain/Alert";
import { AlertService } from "./AlertService";

const TEST_DB_NAME = "TEST_ALERT.db";
const deletePreviousDB = () => {
	try {
		unlinkSync(TEST_DB_NAME);
	} catch (e) {}
};

const fakeProfitStick: Alert["profitStick"] = [
	{
		open: 1,
		close: 1,
		high: 1,
		low: 1,
		volume: 1,
		openTime: 1,
	},
	{
		open: 1,
		close: 1,
		high: 1,
		low: 1,
		volume: 1,
		openTime: 2,
	},
];

const fakeAlerts: Alert[] = [
	{
		start: 1,
		stgName: "Strategy1",
		positionSide: "LONG",
		pair: "BTCUSDT",
		profitStick: fakeProfitStick,
	},
	{
		start: 2,
		stgName: "Strategy2",
		positionSide: "SHORT",
		pair: "ETHUSDT",
		profitStick: fakeProfitStick,
	},
];

describe("Alert Service", () => {
	beforeAll(() => {
		deletePreviousDB();
		const alertService = new AlertService({
			databaseName: TEST_DB_NAME,
			tableName: "alerts",
		});
		alertService.saveAlerts(fakeAlerts);
	});

	afterAll(() => {
		deletePreviousDB();
	});

	test("get alerts", async () => {
		const alertService = new AlertService({
			databaseName: TEST_DB_NAME,
			tableName: "alerts",
		});

		const alerts = await alertService.getAlerts({
			start: 1,
			end: 2,
		});

		expect(alerts).toEqual(fakeAlerts);
	});

	test("delete alerts", async () => {
		const alertService = new AlertService({
			databaseName: TEST_DB_NAME,
			tableName: "alerts",
		});

		await alertService.deleteAlerts();
		const alerts = await alertService.getAlerts({
			start: 1,
			end: 2,
		});

		expect(alerts).toEqual([]);
	});
});
