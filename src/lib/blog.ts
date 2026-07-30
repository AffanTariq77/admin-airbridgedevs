import { supabase } from '@/lib/supabaseClient';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, matches the server limit

// How a section is presented on the public page.
export type BlogSectionStyle = 'normal' | 'callout' | 'quote';

// Shown in the style picker. Kept here so the labels live next to the type.
export const SECTION_STYLES: { value: BlogSectionStyle; label: string }[] = [
  { value: 'normal', label: 'Normal text' },
  { value: 'callout', label: 'Callout box (coloured)' },
  { value: 'quote', label: 'Pull quote' },
];

// One block of a post. Array order is display order.
export type BlogSection = {
  heading: string | null;
  description: string | null;
  images: string[];
  // Optional, because posts written before styles existed do not have it. A
  // missing value reads as 'normal' everywhere.
  style?: BlogSectionStyle;
};

// One question and answer pair, shown as an accordion at the end of the post.
// Array order is display order.
export type BlogFaq = {
  question: string;
  answer: string;
};

// Blog post interface
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  sections?: BlogSection[] | null;
  faqs?: BlogFaq[] | null;
  content_md?: string | null; // legacy body, no longer edited here
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
}

export type BlogPostInput = {
  slug: string;
  title: string;
  description?: string | null;
  sections?: BlogSection[];
  faqs?: BlogFaq[];
  cover_image_url?: string | null;
};

export const emptySection = (): BlogSection => ({
  heading: null,
  description: null,
  images: [],
  style: 'normal',
});

export function isSectionEmpty(section: BlogSection) {
  return (
    !section.heading?.trim() && !section.description?.trim() && section.images.length === 0
  );
}

export const emptyFaq = (): BlogFaq => ({ question: '', answer: '' });

// A FAQ needs both halves to be worth rendering: a question with no answer
// gives the reader a dropdown that opens onto nothing.
export function isFaqIncomplete(faq: BlogFaq) {
  return !faq.question.trim() || !faq.answer.trim();
}

export function isFaqEmpty(faq: BlogFaq) {
  return !faq.question.trim() && !faq.answer.trim();
}

// Turn a title into a URL-safe slug
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// Get all posts, newest first
export async function listPosts() {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to fetch posts');
    }

    return data as BlogPost[];
  } catch (error) {
    console.error('Blog posts fetch error:', error);
    throw error;
  }
}

// Create a post
export async function createPost(input: BlogPostInput) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([input])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(
        error.code === '23505'
          ? 'A post with that slug already exists'
          : error.message || 'Failed to create post'
      );
    }

    return data as BlogPost;
  } catch (error) {
    console.error('Blog post create error:', error);
    throw error;
  }
}

// Update a post
export async function updatePost(id: string, patch: Partial<BlogPostInput>) {
  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .update(patch)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(
        error.code === '23505'
          ? 'A post with that slug already exists'
          : error.message || 'Failed to update post'
      );
    }

    return data as BlogPost;
  } catch (error) {
    console.error('Blog post update error:', error);
    throw error;
  }
}

// Delete a post
export async function deletePost(id: string) {
  try {
    const { error } = await supabase.from('blog_posts').delete().eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      throw new Error(error.message || 'Failed to delete post');
    }
  } catch (error) {
    console.error('Blog post delete error:', error);
    throw error;
  }
}

export type UploadedImage = { name: string; url: string };

// Reject obvious problems before spending a round trip
function checkFile(file: File) {
  if (!file.type.startsWith('image/')) {
    return `"${file.name}" is not an image`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is larger than 5 MB`;
  }
  return null;
}

// Public Supabase Storage bucket the images live in. Uploading straight to
// Supabase means the panel needs no server of its own, so this works the same
// on localhost and on shared hosting, which cannot run Node.
const MEDIA_BUCKET = 'blog-media';

// A unique, URL-safe object name. The extension is kept so the CDN serves the
// right content type, and the random suffix stops two files with the same name
// overwriting each other.
function objectName(file: File) {
  const dot = file.name.lastIndexOf('.');
  const ext = (dot > 0 ? file.name.slice(dot + 1) : 'jpg').toLowerCase();
  const stem =
    (dot > 0 ? file.name.slice(0, dot) : file.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'image';

  return `${stem}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
}

// Upload images to the blog-media bucket. Returns the full public URLs, which
// is what gets stored on the post and rendered by the website.
export async function uploadBlogImages(files: File[]) {
  const failures: string[] = [];
  const accepted: File[] = [];

  files.forEach((file) => {
    const problem = checkFile(file);
    if (problem) {
      failures.push(problem);
    } else {
      accepted.push(file);
    }
  });

  if (!accepted.length) {
    return { uploaded: [] as UploadedImage[], failures };
  }

  const results = await Promise.all(
    accepted.map(async (file) => {
      const path = objectName(file);

      const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
        contentType: file.type,
        cacheControl: '31536000',
      });

      if (error) {
        console.error('Image upload error:', error);

        // The two failures worth naming, because the fix is not in the code
        const detail = error.message.toLowerCase();
        if (detail.includes('bucket not found')) {
          return {
            failure: `Storage bucket "${MEDIA_BUCKET}" does not exist. Create it in Supabase under Storage and mark it Public.`,
          };
        }
        if (detail.includes('policy') || detail.includes('unauthorized')) {
          return {
            failure: `Upload was rejected by Supabase. Run supabase/blog-open-write-policies.sql to allow the panel to write to "${MEDIA_BUCKET}".`,
          };
        }

        return { failure: `"${file.name}" failed to upload: ${error.message}` };
      }

      const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);
      return { image: { name: file.name, url: data.publicUrl } as UploadedImage };
    })
  );

  return {
    uploaded: results.flatMap((result) => (result.image ? [result.image] : [])),
    // Same message twice adds nothing, so only report each problem once
    failures: [
      ...failures,
      ...new Set(results.flatMap((result) => (result.failure ? [result.failure] : []))),
    ],
  };
}

// Single image convenience wrapper, used for the cover image
export async function uploadBlogImage(file: File) {
  const { uploaded, failures } = await uploadBlogImages([file]);

  if (!uploaded.length) {
    throw new Error(failures[0] || 'Upload failed');
  }

  return uploaded[0].url;
}
