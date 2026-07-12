import { defineCollection, z } from 'astro:content';

const services = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    icon: z.string(),
    description: z.string(),
    image: z.string(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    category: z.string(),
    image: z.string(),
    shortDescription: z.string(),
  }),
});

const testimonials = defineCollection({
  type: 'data',
  schema: z.object({
    avatar: z.string(),
    name: z.string(),
    role: z.string(),
    rating: z.number().min(1).max(5),
    quote: z.string(),
    stat: z.string().optional(),
    statCaption: z.string().optional(),
  }),
});

const plans = defineCollection({
  type: 'data',
  schema: z.object({
    planName: z.string(),
    icon: z.string(),
    description: z.string(),
    priceMonthly: z.string(),
    priceYearly: z.string(),
    features: z.array(z.string()),
    highlighted: z.boolean(),
  }),
});

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    image: z.string(),
    publishDate: z.string(),
    author: z.string().optional(),
  }),
});

const team = defineCollection({
  type: 'data',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: z.string(),
  }),
});

export const collections = { services, projects, testimonials, plans, posts, team };
