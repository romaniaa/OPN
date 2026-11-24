import { topoSvg } from "@/lib/TopoMap";

// The contour map behind the top of every page (lib/TopoMap.ts). It touches no
// request data, so it's built once at build time and served as a static file.
export function GET() {
  return new Response(topoSvg(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
