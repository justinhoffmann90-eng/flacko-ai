import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type LearnFrontmatter = {
  title: string;
  description?: string;
  readingTime?: string;
};

export type LearnContent = LearnFrontmatter & {
  slug: string;
  content: string;
};

const contentDirectory = path.join(process.cwd(), "content", "learn");

export function getLearnSlugs(): string[] {
  if (!fs.existsSync(contentDirectory)) return [];
  return fs
    .readdirSync(contentDirectory)
    .filter((file) => file.endsWith(".mdx"))
    .map((file) => file.replace(/\.mdx$/, ""))
    .filter((slug) => slug !== "index");
}

export function getLearnContent(slug: string): LearnContent | null {
  const filePath = path.join(contentDirectory, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    content,
    title: data.title || slug,
    description: data.description || "",
    readingTime: data.readingTime || "",
  };
}
