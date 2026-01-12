const CONCURRENCY_LIMIT = 10;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const processInBatches = async <T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += CONCURRENCY_LIMIT) {
    const batch = items.slice(i, i + CONCURRENCY_LIMIT);
    console.log(
      `Processing batch ${Math.floor(i / CONCURRENCY_LIMIT) + 1}/${Math.ceil(items.length / CONCURRENCY_LIMIT)} (${batch.length} items)`,
    );
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
    if (i + CONCURRENCY_LIMIT < items.length) {
      await delay(500);
    }
  }
  return results;
};

export const fetchPage = async (url: string): Promise<string> => {
  console.log(`Fetching: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }
  return response.text();
};

export const toSnakeCase = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const extractLegendaryGearLinks = (
  html: string,
): { href: string; name: string }[] => {
  const linkRegex =
    /<a[^>]*data-hover="[^"]*ItemGold[^"]*"[^>]*href="([^"]+)"[^>]*>([^<]+)<\/a>/gi;
  const links: { href: string; name: string }[] = [];

  let match: RegExpExecArray | null = linkRegex.exec(html);
  while (match !== null) {
    const href = match[1];
    const name = match[2];

    if (
      href !== undefined &&
      !href.startsWith("http") &&
      !href.startsWith("#") &&
      !href.startsWith("/")
    ) {
      links.push({ href, name });
    }
    match = linkRegex.exec(html);
  }

  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
};
