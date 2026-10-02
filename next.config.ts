import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Uploaded images live on ImageKit. Add your custom domain here if you set one up in ImageKit.
    remotePatterns: [new URL("https://ik.imagekit.io/**")],
  },
  redirects() {
    // The contact page became the "Start project" modal; old links open it on the home page.
    return [{ source: "/contact", destination: "/?start=project", permanent: true }];
  },
};

export default nextConfig;
