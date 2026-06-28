/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/about.html", destination: "/about", permanent: false },
      { source: "/features.html", destination: "/features", permanent: false },
      { source: "/login.html", destination: "/login", permanent: false },
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
