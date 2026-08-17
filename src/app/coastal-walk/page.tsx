import { redirect } from "next/navigation";

/**
 * Route Alias: /coastal-walk -> /coastal
 *
 * Dedicated alias redirecting Coastal Community Church (#3266) members
 * seamlessly into the main faith & fitness walking portal while preserving query parameters.
 */
export default async function CoastalWalkPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const queryString = new URLSearchParams();

  if (resolvedParams) {
    Object.entries(resolvedParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        queryString.set(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => queryString.append(key, v));
      }
    });
  }

  const query = queryString.toString();
  const destination = query ? `/coastal?${query}` : "/coastal";

  redirect(destination);
}
