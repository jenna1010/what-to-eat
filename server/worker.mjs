export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith("/api/")) {
      return handleApi(request, env, albumRestaurants, albumCategories);
    }
    const asset = Object.hasOwn(resources, pathname === "/" ? "/index.html" : pathname)
      ? resources[pathname === "/" ? "/index.html" : pathname]
      : null;
    if (!asset) return new Response("找不到這個頁面", { status: 404 });
    if (!["GET", "HEAD"].includes(request.method)) return new Response(null, { status: 405, headers: { Allow: "GET, HEAD" } });
    const [type, content] = asset;
    let body = null;
    if (request.method === "GET") {
      body = type.startsWith("image/") ? Uint8Array.from(atob(content), char => char.charCodeAt(0)) : content;
    }
    return new Response(body, { headers: {
      "Content-Type": type,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": type.startsWith("image/") ? "public, max-age=86400" : "no-cache"
    } });
  }
};
