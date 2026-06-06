/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/about.html",
        destination: "/about",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
