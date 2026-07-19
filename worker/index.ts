interface Env {
  ASSETS: Fetcher;
}

// Path prefixes this site may be mounted under via Cloudflare routes.
// (The cdd.dev/reflect mount arrives pre-stripped through a service-binding
// proxy in cdd-site; these are for direct zone routes.)
const MOUNTS = ["/mason-os/reflect", "/reflect"];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    for (const mount of MOUNTS) {
      if (url.pathname === mount) {
        return Response.redirect(`${url.origin}${mount}/`, 301);
      }
      if (url.pathname.startsWith(`${mount}/`)) {
        url.pathname = url.pathname.slice(mount.length) || "/";
        request = new Request(url.toString(), request);
        break;
      }
    }

    const response = await env.ASSETS.fetch(request);
    if (new URL(request.url).pathname.startsWith("/img/")) {
      const cached = new Response(response.body, response);
      cached.headers.set("Cache-Control", "public, max-age=604800, immutable");
      return cached;
    }
    return response;
  },
};
