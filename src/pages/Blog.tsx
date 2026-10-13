import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import ImageDropzone from "@/components/ImageDropzone";
import CategoryManager from "@/components/CategoryManager";
import FormatToolbar from "@/components/FormatToolbar";
import {
  createPost,
  deletePost,
  emptyFaq,
  emptySection,
  isFaqEmpty,
  isFaqIncomplete,
  isSectionEmpty,
  listCategories,
  listPosts,
  SECTION_STYLES,
  slugify,
  updatePost,
  uploadBlogImage,
  uploadBlogImages,
  type BlogCategory,
  type BlogFaq,
  type BlogPost,
  type BlogSection,
} from "@/lib/blog";

type FormState = {
  title: string;
  slug: string;
  description: string;
  cover_image_url: string;
  category_id: string;
  sections: BlogSection[];
  faqs: BlogFaq[];
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  cover_image_url: "",
  category_id: "",
  sections: [],
  faqs: [],
};

const inputClass =
  "mt-2 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
const labelClass = "block text-xs font-medium uppercase tracking-wider text-slate-600";

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLegacy, setEditingLegacy] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  // Index of the section currently uploading, so only that dropzone shows busy
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BlogPost | null>(null);

  useEffect(() => {
    listPosts()
      .then(setPosts)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load posts"))
      .finally(() => setLoading(false));

    listCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load categories"));
  }, []);

  const categoryName = (id?: string | null) =>
    categories.find((category) => category.id === id)?.name;

  const filteredPosts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return posts;
    return posts.filter(
      (post) =>
        post.title.toLowerCase().includes(term) ||
        post.slug.toLowerCase().includes(term) ||
        (post.description?.toLowerCase() || "").includes(term)
    );
  }, [posts, search]);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const openNew = () => {
    setEditingId(null);
    setEditingLegacy(false);
    setForm(emptyForm);
    setSlugTouched(false);
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    const sections = post.sections ?? [];
    setEditingId(post.id);
    setEditingLegacy(sections.length === 0 && Boolean(post.content_md?.trim()));
    setForm({
      title: post.title,
      slug: post.slug,
      description: post.description || "",
      cover_image_url: post.cover_image_url || "",
      category_id: post.category_id || "",
      // Clone so edits do not mutate the row held in list state
      sections: sections.map((section) => ({
        heading: section.heading ?? null,
        description: section.description ?? null,
        images: [...(section.images ?? [])],
        style: section.style ?? "normal",
      })),
      faqs: (post.faqs ?? []).map((faq) => ({
        question: faq.question ?? "",
        answer: faq.answer ?? "",
      })),
    });
    setSlugTouched(true);
    setFormError(null);
    setEditorOpen(true);
  };

  const busy = saving || uploading || uploadingSection !== null;

  const closeEditor = () => {
    if (busy) return;
    setEditorOpen(false);
  };

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : slugify(title),
    }));
  };

  const handleCoverFiles = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    setUploading(true);
    setFormError(null);

    try {
      const url = await uploadBlogImage(file);
      setForm((prev) => ({ ...prev, cover_image_url: url }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // ---- Section helpers -----------------------------------------------------

  const patchSection = (index: number, patch: Partial<BlogSection>) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, ...patch } : section
      ),
    }));
  };

  const addSection = () => {
    setForm((prev) => ({ ...prev, sections: [...prev.sections, emptySection()] }));
  };

  const removeSection = (index: number) => {
    setForm((prev) => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setForm((prev) => {
      if (target < 0 || target >= prev.sections.length) return prev;
      const next = [...prev.sections];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, sections: next };
    });
  };

  const handleSectionFiles = async (index: number, files: File[]) => {
    if (!files.length) return;
    setUploadingSection(index);
    setFormError(null);

    try {
      const { uploaded, failures } = await uploadBlogImages(files);

      if (uploaded.length) {
        setForm((prev) => ({
          ...prev,
          sections: prev.sections.map((section, i) =>
            i === index
              ? { ...section, images: [...section.images, ...uploaded.map((img) => img.url)] }
              : section
          ),
        }));
      }

      if (failures.length) {
        setFormError(failures.join(" · "));
      }
    } finally {
      setUploadingSection(null);
    }
  };

  const removeSectionImage = (index: number, url: string) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, images: section.images.filter((img) => img !== url) } : section
      ),
    }));
  };

  // ---- FAQ helpers ---------------------------------------------------------

  const patchFaq = (index: number, patch: Partial<BlogFaq>) => {
    setForm((prev) => ({
      ...prev,
      faqs: prev.faqs.map((faq, i) => (i === index ? { ...faq, ...patch } : faq)),
    }));
  };

  const addFaq = () => {
    setForm((prev) => ({ ...prev, faqs: [...prev.faqs, emptyFaq()] }));
  };

  const removeFaq = (index: number) => {
    setForm((prev) => ({ ...prev, faqs: prev.faqs.filter((_, i) => i !== index) }));
  };

  const moveFaq = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    setForm((prev) => {
      if (target < 0 || target >= prev.faqs.length) return prev;
      const next = [...prev.faqs];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...prev, faqs: next };
    });
  };

  // ---- Save / delete -------------------------------------------------------

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const title = form.title.trim();
    const slug = (form.slug.trim() || slugify(title)).trim();

    if (!title) {
      setFormError("Title is required");
      return;
    }

    if (!slug) {
      setFormError("Slug is required");
      return;
    }

    // Trim every section and drop the ones with nothing in them, so the public
    // page never renders a blank block
    const sections: BlogSection[] = form.sections
      .map((section) => ({
        heading: section.heading?.trim() || null,
        description: section.description?.trim() || null,
        images: section.images,
        style: section.style ?? "normal",
      }))
      .filter((section) => !isSectionEmpty(section));

    // Drop the FAQs left completely blank, then refuse a half-filled one rather
    // than publishing a dropdown that opens onto nothing
    const faqs: BlogFaq[] = form.faqs
      .map((faq) => ({ question: faq.question.trim(), answer: faq.answer.trim() }))
      .filter((faq) => !isFaqEmpty(faq));

    const incomplete = faqs.findIndex(isFaqIncomplete);
    if (incomplete !== -1) {
      setFormError(`FAQ ${incomplete + 1} needs both a question and an answer`);
      return;
    }

    const payload = {
      title,
      slug,
      description: form.description.trim() || null,
      cover_image_url: form.cover_image_url.trim() || null,
      category_id: form.category_id || null,
      sections,
      faqs,
    };

    setSaving(true);

    try {
      if (editingId) {
        const updated = await updatePost(editingId, payload);
        setPosts((prev) => prev.map((post) => (post.id === editingId ? updated : post)));
      } else {
        const created = await createPost(payload);
        setPosts((prev) => [created, ...prev]);
      }
      setEditorOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    const target = pendingDelete;
    setPendingDelete(null);

    try {
      await deletePost(target.id);
      setPosts((prev) => prev.filter((post) => post.id !== target.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete post");
    }
  };

  return (
    <Layout title="Blog">
      <div className="space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/60 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-8 shadow-lg">
          <div className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-violet-500/30 blur-3xl" />
          <div className="absolute -left-10 -bottom-12 h-44 w-44 rounded-full bg-cyan-400/30 blur-3xl" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Content</p>
              <h1 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Blog Posts</h1>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                Write posts here and they appear on the public site straight away.
              </p>
            </div>
            <button
              onClick={openNew}
              className="rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/30 transition hover:brightness-110"
            >
              New post
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Total posts</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{posts.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">With cover image</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {posts.filter((post) => post.cover_image_url).length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-600">Last updated</p>
            <p className="mt-2 text-sm font-semibold text-slate-900">
              {posts.length
                ? formatDate(
                    posts.reduce(
                      (latest, post) => (post.updated_at > latest ? post.updated_at : latest),
                      posts[0].updated_at
                    )
                  )
                : "—"}
            </p>
          </div>
        </div>

        <CategoryManager
          categories={categories}
          setCategories={setCategories}
          posts={posts}
          onDeleted={(id) =>
            setPosts((prev) =>
              prev.map((post) => (post.category_id === id ? { ...post, category_id: null } : post))
            )
          }
        />

        {/* Search */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, slug or summary"
            className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent" />
            <p className="mt-4 text-sm text-slate-600">Loading posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
            <p className="text-slate-600">
              {posts.length === 0
                ? "No posts yet. Create your first one."
                : "No posts match that search."}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              {/* table-fixed plus explicit widths, so a long title or slug
                  truncates instead of pushing the actions off-screen */}
              <table className="w-full min-w-[880px] table-fixed">
                <colgroup>
                  <col className="w-[92px]" />
                  <col />
                  <col className="w-[190px]" />
                  <col className="w-[90px]" />
                  <col className="w-[150px]" />
                  <col className="w-[160px]" />
                </colgroup>
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Cover
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Slug / category
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Sections
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-600">
                      Updated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-slate-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPosts.map((post) => {
                    const sectionCount = post.sections?.length ?? 0;
                    const isLegacy = sectionCount === 0 && Boolean(post.content_md?.trim());

                    return (
                      <tr key={post.id} className="align-top transition-colors hover:bg-slate-50">
                        <td className="px-4 py-3">
                          {post.cover_image_url ? (
                            <img
                              src={post.cover_image_url}
                              alt=""
                              className="h-11 w-[68px] rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-11 w-[68px] rounded-lg bg-gradient-to-br from-violet-200 to-cyan-200" />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p
                            className="line-clamp-2 text-sm font-medium text-slate-900"
                            title={post.title}
                          >
                            {post.title}
                          </p>
                          {post.description && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {post.description}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="truncate text-sm text-slate-600" title={`/${post.slug}`}>
                            /{post.slug}
                          </p>
                          <span
                            className={`mt-1 inline-block max-w-full truncate rounded-full px-2 py-0.5 text-xs font-medium ${
                              categoryName(post.category_id)
                                ? "bg-violet-100 text-violet-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {categoryName(post.category_id) ?? "No category"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-600">
                          {isLegacy ? (
                            <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              old format
                            </span>
                          ) : (
                            sectionCount
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                          {formatDate(post.updated_at)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => openEdit(post)}
                              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setPendingDelete(post)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Editor modal */}
        {editorOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingId ? "Edit post" : "New post"}
                </h3>
                <button
                  onClick={closeEditor}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Close"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5 p-6">
                {formError && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {formError}
                  </div>
                )}

                {editingLegacy && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    This post was written before sections existed, so its old body is what the
                    public page still shows. Adding a section here replaces it.
                  </div>
                )}

                <div>
                  <label className={labelClass}>Title</label>
                  <input
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="How we cut LLM costs by 60%"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label className={labelClass}>Slug</label>
                  <input
                    className={inputClass}
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setForm((prev) => ({ ...prev, slug: e.target.value }));
                    }}
                    placeholder="how-we-cut-llm-costs"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Public URL: /blog/{form.slug || "your-slug"}
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Summary</label>
                  <textarea
                    className={`${inputClass} min-h-[80px]`}
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="One or two lines. This is what shows on the blog cards and at the top of the post."
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Keep this short. The article itself goes in the sections below.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Category</label>
                  <select
                    className={inputClass}
                    value={form.category_id}
                    onChange={(e) => setForm((prev) => ({ ...prev, category_id: e.target.value }))}
                  >
                    <option value="">No category (only under "All posts")</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-slate-500">
                    Which side tab this post appears under on the blog page. Manage the list in
                    Categories above.
                  </p>
                </div>

                <div>
                  <label className={labelClass}>Cover image</label>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
                    {form.cover_image_url ? (
                      <img
                        src={form.cover_image_url}
                        alt="Cover preview"
                        className="h-28 w-44 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-28 w-44 items-center justify-center rounded-xl bg-gradient-to-br from-violet-200 to-cyan-200 text-xs text-slate-600">
                        No image
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <ImageDropzone
                        onFiles={handleCoverFiles}
                        disabled={uploading}
                        label={uploading ? "Uploading..." : "Drop an image here, or click to choose"}
                        hint="PNG or JPG, up to 5 MB"
                      />
                      {form.cover_image_url && (
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, cover_image_url: "" }))}
                          className="text-xs font-medium text-red-600 hover:text-red-700"
                        >
                          Remove image
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div className="space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={labelClass}>Sections</label>
                      <p className="mt-1 text-xs text-slate-500">
                        The body of the post. Each section shows its heading, then its text, then
                        its images. Add as many as you need.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addSection}
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Add section
                    </button>
                  </div>

                  {form.sections.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No sections yet. You can save now and add them later.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.sections.map((section, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-700">
                              Section {index + 1}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveSection(index, -1)}
                                disabled={index === 0}
                                title="Move up"
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveSection(index, 1)}
                                disabled={index === form.sections.length - 1}
                                title="Move down"
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeSection(index)}
                                className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                            <div>
                              <label className={labelClass}>Heading (optional)</label>
                              <input
                                className={inputClass}
                                value={section.heading || ""}
                                onChange={(e) => patchSection(index, { heading: e.target.value })}
                                placeholder="Why AI is not magic"
                              />
                            </div>
                            <div>
                              <label className={labelClass}>Style</label>
                              <select
                                className={`${inputClass} sm:w-52`}
                                value={section.style ?? "normal"}
                                onChange={(e) =>
                                  patchSection(index, {
                                    style: e.target.value as BlogSection["style"],
                                  })
                                }
                              >
                                {SECTION_STYLES.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className={labelClass}>Description</label>
                            <FormatToolbar
                              textareaId={`section-description-${index}`}
                              value={section.description || ""}
                              onChange={(description) => patchSection(index, { description })}
                            />
                            <textarea
                              id={`section-description-${index}`}
                              className={`${inputClass} min-h-[140px] font-mono`}
                              value={section.description || ""}
                              onChange={(e) => patchSection(index, { description: e.target.value })}
                              placeholder={
                                "Write this part of the article here.\n\n### A smaller heading\nUse **bold**, *italics*, - bullet lists and | tables |."
                              }
                            />
                            <p className="mt-1 text-xs text-slate-500">
                              Markdown works here: <code>###</code> for a smaller heading inside the
                              section, <code>**bold**</code>, <code>[coloured words](color:pink)</code>,{" "}
                              <code>*italics*</code>, <code>•</code>{" "}
                              for bullets, <code>&gt;</code> for a quote, and pipe tables. Blank line
                              between paragraphs.
                            </p>
                          </div>

                          <div className="mt-3">
                            <label className={labelClass}>Images (optional)</label>
                            <div className="mt-2 space-y-3">
                              <ImageDropzone
                                onFiles={(files) => handleSectionFiles(index, files)}
                                multiple
                                disabled={uploadingSection === index}
                                label={
                                  uploadingSection === index
                                    ? "Uploading..."
                                    : "Drop images here, or click to choose several"
                                }
                                hint="They appear under this section's text, in this order"
                              />

                              {section.images.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                  {section.images.map((url) => (
                                    <div
                                      key={url}
                                      className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                                    >
                                      <img src={url} alt="" className="h-24 w-full object-cover" />
                                      <div className="px-2 py-1.5 text-right">
                                        <button
                                          type="button"
                                          onClick={() => removeSectionImage(index, url)}
                                          className="text-xs font-medium text-red-600 hover:text-red-700"
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questions and answers */}
                <div className="space-y-4 border-t border-slate-200 pt-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className={labelClass}>Questions and answers</label>
                      <p className="mt-1 text-xs text-slate-500">
                        Shown at the end of the post as dropdowns the reader can open. Add as many
                        as you need.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addFaq}
                      className="shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Add question
                    </button>
                  </div>

                  {form.faqs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                      No questions yet. Leave this empty to hide the block on the post.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {form.faqs.map((faq, index) => (
                        <div
                          key={index}
                          className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-slate-700">FAQ {index + 1}</p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveFaq(index, -1)}
                                disabled={index === 0}
                                title="Move up"
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() => moveFaq(index, 1)}
                                disabled={index === form.faqs.length - 1}
                                title="Move down"
                                className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFaq(index)}
                                className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>

                          <div className="mt-3">
                            <label className={labelClass}>Question</label>
                            <input
                              className={inputClass}
                              value={faq.question}
                              onChange={(e) => patchFaq(index, { question: e.target.value })}
                              placeholder="How long does an integration take?"
                            />
                          </div>

                          <div className="mt-3">
                            <label className={labelClass}>Answer</label>
                            <textarea
                              className={`${inputClass} min-h-[110px]`}
                              value={faq.answer}
                              onChange={(e) => patchFaq(index, { answer: e.target.value })}
                              placeholder="Answer the question here. Line breaks are kept."
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={busy}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingId ? "Save changes" : "Publish post"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete confirmation */}
        {pendingDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-slate-900">Delete this post?</h3>
              <p className="mt-2 text-sm text-slate-600">
                "{pendingDelete.title}" will be removed from the public site. This cannot be undone.
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setPendingDelete(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
