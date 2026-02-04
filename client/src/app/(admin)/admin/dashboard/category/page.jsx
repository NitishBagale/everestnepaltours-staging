// app/admin/category/page.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";
import toast, { Toaster } from "react-hot-toast";

// Initial state for form reset
const initialFormData = {
  name: "",
  slug: "",
};

const createSlug = (text = "") =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const SortableCategoryItem = ({ category, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="py-4 flex justify-between items-center"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          className="text-gray-400 hover:text-gray-600 cursor-grab"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          ⋮⋮
        </button>
        <div className="min-w-0">
          <p className="text-base font-semibold truncate">{category.name}</p>
          <p className="text-xs text-gray-500 truncate">
            ID: {String(category.id).substring(0, 8)}...
          </p>
          {category.slug ? (
            <p className="text-xs text-gray-500 truncate">
              Slug: {category.slug}
            </p>
          ) : null}
        </div>
      </div>
      <div className="space-x-4 flex shrink-0">
        <button
          onClick={() => onEdit(category)}
          className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium text-sm"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(category.id, category.name)}
          className="text-red-600 hover:text-red-900 font-medium text-sm"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

const CategoryAdminPage = () => {
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [slugEdited, setSlugEdited] = useState(false);

  // ====================== UTILITY FUNCTIONS ======================
  const getToken = () => {
    return (
      Cookies.get("accessToken") ||
      Cookies.get("token") ||
      localStorage.getItem("admin_token") ||
      sessionStorage.getItem("admin_token")
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "name") {
      setFormData((prev) => {
        const next = { ...prev, name: value };
        if (!slugEdited || !prev.slug) {
          next.slug = createSlug(value);
        }
        return next;
      });
      return;
    }

    if (name === "slug") {
      setSlugEdited(true);
      setFormData((prev) => ({ ...prev, slug: value }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancelEdit = () => {
    setEditCategoryId(null);
    setFormData(initialFormData);
    setSlugEdited(false);
  };

  // ====================== CRUD - READ (Fetch List) ======================
  const fetchCategories = useCallback(async () => {
    setListLoading(true);
    try {
      const token = getToken();
      const response = await axios.get(`${BASE_URL}/category/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Assuming API returns data as: { status: 'success', data: [...] }
      const raw = response.data.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aOrder = Number(a.sort_order) || 0;
        const bOrder = Number(b.sort_order) || 0;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return String(a.name || "").localeCompare(String(b.name || ""));
      });
      setCategories(sorted);
    } catch (error) {
      console.error("Fetch Categories Error:", error);
      toast.error("Failed to load categories.");
      setCategories([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // ====================== CRUD - EDIT (Load Data to Form) ======================
  const handleEdit = (categoryData) => {
    const derivedSlug =
      categoryData.slug || createSlug(categoryData.name || "");
    setEditCategoryId(categoryData.id);
    setFormData({
      name: categoryData.name || "",
      slug: derivedSlug,
    });
    setSlugEdited(Boolean(categoryData.slug));
    const scrollContainer = document.getElementById("admin-scroll-area");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ====================== CRUD - SUBMIT (Create/Update) ======================
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const accessToken = getToken();
      if (!accessToken) {
        toast.error("Authentication required");
        setLoading(false);
        return;
      }

      const slugValue =
        formData.slug?.trim() || createSlug(formData.name || "");
      const payload = {
        name: formData.name,
        slug: slugValue,
      };

      let successMessage;

      if (editCategoryId) {
        // UPDATE MODE: PUT /category/:id
        await axios.put(`${BASE_URL}/category/${editCategoryId}`, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        successMessage = "Category updated successfully!";
      } else {
        // CREATE MODE: POST /category/
        await axios.post(`${BASE_URL}/category/`, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        successMessage = "Category created successfully!";
      }

      toast.success(successMessage);
      handleCancelEdit();
      fetchCategories();
    } catch (error) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.message ||
        `Failed to ${editCategoryId ? "update" : "create"} category`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ====================== CRUD - DELETE ======================
  const handleDelete = async (categoryId, categoryName) => {
    const title = categoryName || "This Category";

    // Custom Confirmation Dialog
    const confirmed = await new Promise((resolve) => {
      toast(
        (t) => (
          <div className="flex flex-col p-2 bg-white rounded-lg shadow-lg">
            <p className="text-sm font-semibold mb-3">
              Are you sure you want to delete{" "}
              <span className="text-red-600 font-bold">"{title}"</span>?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className="px-3 py-1 text-sm rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmed) {
      return;
    }

    // Start loading toast *after* confirmation
    const deleteToastId = toast.loading(`Deleting ${title}...`);
    try {
      const token = getToken();

      // DELETE API: DELETE /category/:id
      await axios.delete(`${BASE_URL}/category/${categoryId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${title} deleted successfully!`, { id: deleteToastId });
      fetchCategories();
      handleCancelEdit();
    } catch (error) {
      console.error("Delete Error:", error);

      let errorMessage = `Failed to delete ${title}`;

      if (error.response?.status === 403) {
        errorMessage =
          "Authorization failed. Your admin role may not be properly configured in the database. Please verify your account has 'admin' or 'editor' role assigned.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, { id: deleteToastId });
    }
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((cat) => cat.id === active.id);
    const newIndex = categories.findIndex((cat) => cat.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(categories, oldIndex, newIndex);
    setCategories(reordered);

    try {
      const token = getToken();
      await Promise.all(
        reordered.map((cat, index) =>
          axios.put(
            `${BASE_URL}/category/${cat.id}`,
            {
              name: cat.name,
              slug: cat.slug || createSlug(cat.name || ""),
              sort_order: index + 1,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
        )
      );
      toast.success("Category order updated");
    } catch (error) {
      console.error("Sort order update failed:", error);
      toast.error("Failed to update order");
      fetchCategories();
    }
  };

  return (
    <>
      {/* TOASTER POSITION SET TO TOP-CENTER */}
      <Toaster position="top-center" />

      <div className="min-h-screen py-4 md:py-6">
        <div className="w-full">
          {/* ======================= CATEGORY FORM (CREATE/EDIT) ======================= */}
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md mb-10">
            <h1 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
              {editCategoryId
                ? `Edit Category: ${formData.name}`
                : "Create New Category"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full border p-3 rounded focus:outline-[var(--admin-primary)] text-base"
                  placeholder="e.g., Nepal Tours"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Slug
                </label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="w-full border p-3 rounded focus:outline-[var(--admin-primary)] text-base"
                  placeholder="e.g., nepal-tours"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Auto-generated from the name. You can edit it.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 bg-[var(--admin-primary)] text-white font-bold py-3 rounded hover:bg-[var(--admin-primary-strong)] transition disabled:opacity-50 text-base`}
                >
                  {loading
                    ? "Processing..."
                    : editCategoryId
                    ? "Update Category"
                    : "Save New Category"}
                </button>

                {editCategoryId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="w-40 bg-gray-300 text-gray-800 font-bold py-3 rounded hover:bg-gray-400 transition text-base"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* ======================= CATEGORY LIST ======================= */}
          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-xl font-bold mb-4 border-b pb-2">
              Existing Categories ({categories.length})
            </h2>

            {listLoading ? (
              <div className="p-4 text-center">Loading categories...</div>
            ) : categories.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No categories found.
              </div>
            ) : (
              <DndContext
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={categories.map((cat) => cat.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="divide-y divide-gray-200">
                    {categories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default CategoryAdminPage;
