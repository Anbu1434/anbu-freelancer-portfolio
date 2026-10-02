import { collections } from "@/lib/db/client";
import { createOrderedRepo } from "@/lib/db/ordered-repo";
import type {
  ExperienceInput,
  ProcessStepInput,
  ProjectInput,
  ServiceInput,
  StackGroupInput,
  TestimonialInput,
} from "@/lib/db/schemas";

export const repos = {
  projects: createOrderedRepo<ProjectInput>(collections.projects),
  services: createOrderedRepo<ServiceInput>(collections.services),
  processSteps: createOrderedRepo<ProcessStepInput>(collections.processSteps),
  experience: createOrderedRepo<ExperienceInput>(collections.experience),
  stackGroups: createOrderedRepo<StackGroupInput>(collections.stackGroups),
  testimonials: createOrderedRepo<TestimonialInput>(collections.testimonials),
};
