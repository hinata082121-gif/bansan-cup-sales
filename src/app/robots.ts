import type { MetadataRoute } from "next";

/** 検索エンジンのクロールをすべて拒否する */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
