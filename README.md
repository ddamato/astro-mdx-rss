# Astro MDX RSS Starter

Did you expect to render MDX posts into your RSS feed with Astro, only to find out that you can only render MDX in `.astro` files? Yep, me too.

Astro is working on the [Container API](https://github.com/withastro/roadmap/issues/533) which is expected to solve the problem. In the meantime, you can consider this repo which uses Astro's blog starter as the base with a few updates.

- Add `mdx` integration.
- All content files are `.mdx`.
- Added `/pages/rss.astro`.

## `pages/rss.xml.js`

Instead of using `@astrojs/rss` to create the RSS feed, we're going to take the response from the new `/pages/rss.astro` file and send it out with a new header.

```js
export async function GET(context) {
  const endpoint = new URL('/rss', context.url.origin);
  const xml = await fetch(endpoint).then((res) => res.text());
  return new Response(xml, {
    status: 200,
    headers: new Headers({ 'Content-type': 'text/xml;charset=UTF-8' })
  });
}
```

- The `/rss` route points to the `/rss` page (more specifically, `/pages/rss.astro`).
- We get the response text from that request, and set it as the body of the upcoming response.
- We add the `'Content-type: text/xml;charset=UTF-8'` header to let the browser know this is XML.

## `/pages/rss.astro`

This page builds the RSS feed and it has a few gotchas.

```.astro
---
export const partial = true;
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
const posts = await getCollection('blog');
---
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>{ SITE_TITLE }</title>
    <description>{ SITE_DESCRIPTION }</description>
    <Fragment set:html={ `<link>${ Astro.url.origin }</link>` }/>
  </channel>
  { posts.map(async (post) => {
    const url = new URL(`blog/${post.slug}`, Astro.url.origin).toString();
    const { Content } = await post.render();
    return (
      <item>
        <title>{post.data.title}</title>
        <Fragment set:html={ `<link>${ url }</link>` }/>
        <guid>{ url }</guid>
        <description>{ post.data.description }</description>
        <pubDate>{ post.data.pubDate }</pubDate>
          <Fragment is:raw>
            <content:encoded><![CDATA[
          </Fragment>
          <Content/>
          <Fragment is:raw>
            ]]></content:encoded>
          </Fragment>
      </item>
    )
  }) }
</rss>
```

- The `export const partial = true;` tells Astro to _not_ add the expected `<html>`, `<head>`, and `<body>` tags and to treat this as an [HTML partial](https://docs.astro.build/en/basics/astro-pages/#page-partials).
- The `<Fragment set:html={ `<link>${ Astro.url.origin }</link>` }/>` is needed because Astro considers `<link>` to be a self-closing tag and won't render the ending tag causing the feed to be invalid. We circumvent this by writing the HTML using `set:html` in a `<Fragment/>`.
- The whole purpose of this is the `<Content/>` element, which _must_ be rendered in an `.astro` file. We flank both sides with `<Fragment is:raw>` elements which tells Astro not to process anything between the `<Fragment/>` tags. This allows the `<content:encoding>` and `CDATA` to render as a string.

> [!NOTE] Hitting `/rss` in the browser does not provide an XML response, but an HTML one. So mileage may vary about how valid that appears to syndication.

And now hitting `/rss.xml` should provide a fully qualified RSS feed with rendered MDX! You'll most likely need to update the `/pages/rss.astro` file for a more detailed feed.