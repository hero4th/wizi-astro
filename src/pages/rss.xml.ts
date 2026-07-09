import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/data/site";
import { getPublishedPosts } from "@/lib/blog";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  return rss({
    title: `Blog | ${SITE.name}`,
    description:
      "Guías de TOEFL, SAT, GRE, GMAT y PAA, técnicas de estudio y procesos de admisión.",
    site: context.site!,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/blog/${post.id}`,
      categories: post.data.categories.map((c) => c.name),
      content: post.data.html,
    })),
    customData: "<language>es-MX</language>",
  });
}
