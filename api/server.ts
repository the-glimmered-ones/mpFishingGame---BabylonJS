Bun.serve({
  fetch(request) {
    const url = new URL(request.url);
 
    return Response.json({
      message: 'Hello from Bun on Vercel',
      pathname: url.pathname,
    });
  },
});