/** @type {import('next').NextConfig} */
const nextConfig = {
  /**
   * Local development against the hosted backend.
   *
   * The hosted CORS allowlist admits only the deployed web origins, so a browser on localhost
   * cannot call it directly. Forwarding through this server sidesteps that without touching
   * the allowlist: the browser makes a same-origin request and Next proxies it server-side,
   * where CORS does not apply. Unset in normal local work and on deployments, where the API
   * base is an absolute URL and no rewrite matches.
   */
  async rewrites() {
    const target = process.env.KLARIO_PROXY_API_TO;
    if (!target) return [];
    return [{ source: "/api/v1/:path*", destination: `${target.replace(/\/$/, "")}/api/v1/:path*` }];
  },

  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/about.html", destination: "/about", permanent: false },
      { source: "/features.html", destination: "/features", permanent: false },
      { source: "/login.html", destination: "/login", permanent: false },
      { source: "/forgot-password.html", destination: "/forgot-password", permanent: false },
      { source: "/reset-password.html", destination: "/reset-password", permanent: false },
      { source: "/app/dashboard.html", destination: "/app/dashboard", permanent: false },
      { source: "/app/documents.html", destination: "/app/documents", permanent: false },
      { source: "/app/upload.html", destination: "/app/upload", permanent: false },
      { source: "/app/timeline.html", destination: "/app/timeline", permanent: false },
      { source: "/app/trends.html", destination: "/app/trends", permanent: false },
      { source: "/app/family.html", destination: "/app/family", permanent: false },
      { source: "/app/account.html", destination: "/app/account", permanent: false },
      { source: "/app/settings.html", destination: "/app/settings", permanent: false }
    ];
  }
};

export default nextConfig;
