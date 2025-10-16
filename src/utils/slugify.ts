function slugify(text: string): string {
   return text
      .toLowerCase() // Convert to lowercase
      .trim() // Remove leading/trailing whitespace
      .replace(/[^\w\s-]/g, "") // Remove all non-word characters (punctuation, etc.)
      .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with a single hyphen
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

export { slugify };
