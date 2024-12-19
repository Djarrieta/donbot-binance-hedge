import { initializeApp } from "firebase/app";
import {
	addDoc,
	collection,
	deleteDoc,
	getDocs,
	getFirestore,
	orderBy,
	query,
	where,
} from "firebase/firestore";
import type { GetLogsProps, ILog } from "../domain/ILog";
import type { Log } from "../domain/Log";

export class LogServiceFirebase implements ILog {
	private collectionRef;

	constructor() {
		const firebaseConfig = {
			apiKey: "AIzaSyDUxatjawkjrqKgd6Mmfe3GI5nUJZFp_c4",
			authDomain: "donbot-cac0f.firebaseapp.com",
			projectId: "donbot-cac0f",
			storageBucket: "donbot-cac0f.firebasestorage.app",
			messagingSenderId: "516945730531",
			appId: "1:516945730531:web:ba8b5cabadc5326c8e9ed6",
		};

		const app = initializeApp(firebaseConfig);
		const db = getFirestore(app);
		this.collectionRef = collection(db, "logs");
	}

	async save(log: Log) {
		const data: any = {};
		if (log.eventData !== undefined) {
			data.eventData = JSON.stringify(log.eventData);
		}
		if (log.type !== undefined) {
			data.type = log.type;
		}
		if (log.date !== undefined) {
			data.date = log.date;
		}
		if (log.tradeData) {
			if (log.tradeData.userList !== undefined) {
				data.userList = JSON.stringify(log.tradeData.userList);
			}
			if (log.tradeData.strategies !== undefined) {
				data.strategies = JSON.stringify(log.tradeData.strategies);
			}
			if (log.tradeData.config !== undefined) {
				data.config = JSON.stringify(log.tradeData.config);
			}
			if (log.tradeData.isLoading !== undefined) {
				data.isLoading = log.tradeData.isLoading;
			}
		}
		await addDoc(this.collectionRef, data);
	}

	async get({ start, end, type }: GetLogsProps): Promise<Log[]> {
		let q = query(this.collectionRef, orderBy("date", "asc"));

		if (start) {
			q = query(q, where("date", ">=", start));
		}

		if (end) {
			q = query(q, where("date", "<=", end));
		}

		if (type) {
			q = query(q, where("type", "==", type));
		}

		const querySnapshot = await getDocs(q);
		const results: Log[] = [];

		querySnapshot.forEach((doc) => {
			const data = doc.data();
			results.push({
				date: data.date,
				type: data.type,
				eventData: data.eventData && JSON.parse(data.eventData),
				tradeData: {
					symbolList: data.symbolList && JSON.parse(data.symbolList),
					userList: data.userList && JSON.parse(data.userList),
					strategies: data.strategies && JSON.parse(data.strategies),
					config: data.config && JSON.parse(data.config),
					isLoading: data.isLoading,
				},
			});
		});

		return results;
	}

	async deleteAll(): Promise<void> {
		const querySnapshot = await getDocs(this.collectionRef);

		querySnapshot.forEach(async (doc) => {
			await deleteDoc(doc.ref);
		});

		console.log(`All documents deleted from the 'logs' collection.`);
	}

	async showLogs({ start, end, type }: GetLogsProps) {
		const logs = await this.get({ start, end, type });
		console.log(logs);
	}
}
