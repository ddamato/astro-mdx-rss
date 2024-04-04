export async function GET(context) {
	const endpoint = new URL('/rss', context.url.origin);
	const xml = await fetch(endpoint).then((res) => res.text());
	return new Response(xml, {
		status: 200,
		headers: new Headers({ 'Content-type': 'text/xml;charset=UTF-8' })
	});
}
