import { useState } from "react";
import {
  deleteCategory,
  saveCategory,
  slugify,
  type BlogCategory,
  type BlogPost,
} from "@/lib/blog";

type Props = {
  categories: BlogCategory[];
  setCategories: React.Dispatch<React.SetStateAction<BlogCategory[]>>;
  posts: BlogPost[];
  // Lets the parent clear category_id on its copy of the posts after a delete
  onDeleted: (id: string) => void;
};

const smallButton =
  "rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 hover:bg-white disabled:opacity-40";

// The side tabs on the public blog page: add, rename, reorder and delete them
export default function CategoryManager({ categories, setCategories, posts, onDeleted }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name) return;

    run(async () => {
      const position = categories.reduce((max, c) => Math.max(max, c.position), -1) + 1;
      const created = await saveCategory({ name, slug: slugify(name), position });
      setCategories((prev) => [...prev, created]);
      setNewName("");
    });
  };

  const handleRename = (category: BlogCategory) => {
    const name = editName.trim();
    if (!name || name === category.name) {
      setEditingId(null);
      return;
    }

    run(async () => {
      const updated = await saveCategory({ ...category, name, slug: slugify(name) });
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
    });
  };

  // Write both rows' new indexes, so it works even when positions are tied
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    const a = categories[index];
    const b = categories[target];
    if (!a || !b) return;

    run(async () => {
      const [movedA, movedB] = await Promise.all([
        saveCategory({ ...a, position: target }),
        saveCategory({ ...b, position: index }),
      ]);
      setCategories((prev) => {
        const next = [...prev];
        next[target] = movedA;
        next[index] = movedB;
        return next;
      });
    });
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteId(null);
    run(async () => {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      onDeleted(id);
    });
  };

  const countFor = (id: string) => posts.filter((post) => post.category_id === id).length;
  const uncategorised = posts.filter((post) => !post.category_id).length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Categories</h2>
          <p className="mt-1 text-sm text-slate-500">
            The tabs down the side of the blog page, in this order. Pick a post's category in the
            post editor.
          </p>
        </div>
        {uncategorised > 0 && (
          <p className="text-xs text-slate-500">
            {uncategorised} {uncategorised === 1 ? "post has" : "posts have"} no category and only
            show under "All posts"
          </p>
        )}
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {categories.length > 0 && (
        <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200">
          {categories.map((category, index) => (
            <li key={category.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              {editingId === category.id ? (
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleRename(category);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{category.name}</p>
                  <p className="text-xs text-slate-500">
                    {countFor(category.id)} posts · /blog?category={category.slug}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-1">
                {editingId === category.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleRename(category)}
                      disabled={busy}
                      className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className={smallButton}>
                      Cancel
                    </button>
                  </>
                ) : confirmDeleteId === category.id ? (
                  <>
                    <span className="mr-1 text-xs text-slate-600">Delete? Posts are kept.</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(category.id)}
                      disabled={busy}
                      className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(null)}
                      className={smallButton}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={busy || index === 0}
                      title="Move up"
                      className={smallButton}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={busy || index === categories.length - 1}
                      title="Move down"
                      className={smallButton}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(category.id);
                        setEditName(category.name);
                      }}
                      disabled={busy}
                      className={smallButton}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(category.id)}
                      disabled={busy}
                      className="rounded-lg border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-40"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} className="mt-4 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={categories.length ? "New category name" : "Add your first category, e.g. AI Strategy"}
        />
        <button
          type="submit"
          disabled={busy || !newName.trim()}
          className="shrink-0 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-40"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
