const upstream = 'https://timestamp-microservice.freecodecamp.rocks';

export async function proxy(path, method, headers, body) {
  const forwarded = new Headers();
  for (const name of ['accept', 'content-type']) {
    if (headers.has(name)) forwarded.set(name, headers.get(name));
  }
  try {
    const response = await fetch(upstream + path, {
      method, headers: forwarded, body, duplex: 'half', redirect: 'manual',
      signal: AbortSignal.timeout(30000)
    });
    const outgoing = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store'
    });
    for (const name of ['content-type', 'location', 'access-control-allow-methods', 'access-control-allow-headers']) {
      if (response.headers.has(name)) outgoing.set(name, response.headers.get(name));
    }
    const location = outgoing.get('location');
    if (location) {
      const target = new URL(location, upstream + path);
      if (target.origin === upstream) outgoing.set('location', target.pathname + target.search + target.hash);
    }
    return new Response(response.body, { status: response.status, headers: outgoing });
  } catch {
    return Response.json({ error: 'Upstream unavailable' }, { status: 502, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
