import { App } from "./server/app";
import { Pairs } from "./server/pairs";

Bun.serve({
	port: 3000,
	async fetch(req) {
		const url = new URL(req.url);

		if (url.pathname.startsWith("/pairs/") && url.pathname.split("/")[2]) {
			try {
				const pair = url.pathname.split("/")[2] || "";
				const { head, body } = Pairs({ pair });

				return new Response(App({ head, body }), {
					headers: { "Content-Type": "text/html" },
				});
			} catch (error) {
				console.error("Error pairs:", error);
				return new Response("Internal Server Error", { status: 500 });
			}
		}

		return new Response("404 Not Found", { status: 404 });
	},
});
