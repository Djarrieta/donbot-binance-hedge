export const App = ({ head, body }: { head: string; body: string }) => {
	try {
		const html = `
                <!DOCTYPE html>
                            <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    ${head}
                </head>
                ${body}
                </html>`;

		return new Response(html, {
			headers: { "Content-Type": "text/html" },
		});
	} catch (error) {
		console.error("Error pairs:", error);
		return new Response("Internal Server Error", { status: 500 });
	}
};
