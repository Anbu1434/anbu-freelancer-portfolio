import type { ProcessStep, Service } from "@/types/content";

export const services: Service[] = [
  {
    number: "01",
    title: "Web applications",
    description: "From idea to live product.",
    includes: ["Custom web apps", "Auth & payments", "API integrations"],
  },
  {
    number: "02",
    title: "E-commerce",
    description: "Stores built to sell.",
    includes: ["Custom storefronts", "Checkout flows", "Order management"],
  },
  {
    number: "03",
    title: "Product UI",
    description: "Clean screens people enjoy using.",
    includes: ["Interface design", "Design systems", "Clickable prototypes"],
  },
  {
    number: "04",
    title: "AI integration",
    description: "Smart features that actually help.",
    includes: ["Chat assistants", "Smart search", "Workflow automation"],
  },
  {
    number: "05",
    title: "SaaS development",
    description: "Subscription products, ready to scale.",
    includes: ["Subscription billing", "Admin dashboards", "Team accounts"],
  },
  {
    number: "06",
    title: "SEO & performance",
    description: "Faster sites, found first.",
    includes: ["Technical SEO", "Core Web Vitals", "Speed audits"],
  },
];

export const workProcess: ProcessStep[] = [
  {
    number: "01",
    title: "Discover",
    description: "We define the problem, the people it's for, and what a good outcome looks like.",
  },
  {
    number: "02",
    title: "Design",
    description: "Structure, flows and interface — reviewed together before a line of production code.",
  },
  {
    number: "03",
    title: "Build",
    description: "Iterative development with working previews you can click through along the way.",
  },
  {
    number: "04",
    title: "Launch",
    description: "Deployment, handover and a clear path for whatever comes next.",
  },
];
