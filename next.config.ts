import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  redirects() {
    // The contact page became the "Start project" modal; old links open it on the home page.
    return [{ source: "/contact", destination: "/?start=project", permanent: true }];
  },
};

export default nextConfig;
