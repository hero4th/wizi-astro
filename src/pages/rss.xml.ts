export const prerender = false;

import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { SITE } from "@/data/site";
import { getPublishedPosts } from "@/lib/blog";
import { cacheBlogResponse } from "@/lib/cache";

export async function GET(context: APIContext) {
  const posts = await getPublishedPosts();

  const response = await rss({
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

  cacheBlogResponse(response);
  return response;
}
