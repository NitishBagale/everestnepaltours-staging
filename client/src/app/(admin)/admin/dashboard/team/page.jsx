"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
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
import MediaPickerModal from "@/components/media/MediaPickerModal";
import RichEditor from "@/components/editor/RichEditor";

const initialFormData = {
  name: "",
  designation: "",
  description: "",
  imageUrl: "",
  meta_title: "",
  meta_description: "",
  meta_keywords: "",
};

const normalizeImage = (media) => {
  if (!media) return "";
  if (typeof media === "string") {
    return { mediaId: null, url: media, variants: {}, title: "", altText: "" };
  }
  return media;
};

const TeamMemberAdminPage = () => {
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [teamMembers, setTeamMembers] = useState([]);
  const [sortedTeamMembers, setSortedTeamMembers] = useState([]);
  const [editMemberName, setEditMemberName] = useState(null);
  const [editMemberId, setEditMemberId] = useState(null);
  const [visibleCount, setVisibleCount] = useState(10);

  const getToken = () => {
    return Cookies.get("accessToken") || Cookies.get("token");
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDescriptionChange = (value) => {
    setFormData({ ...formData, description: value });
  };

  const handlePhotoSelect = (media) => {
    setFormData((prev) => ({ ...prev, imageUrl: media }));
  };

  const handleCancelEdit = () => {
    setEditMemberName(null);
    setEditMemberId(null);
    setFormData(initialFormData);
  };

  const fetchTeamMembers = useCallback(async () => {
    setListLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/team/`);

      const members =
        response.data?.teams || response.data?.data || response.data || [];

      console.log("Team Members Response:", response.data);

      const nextMembers = Array.isArray(members) ? members : [];
      setTeamMembers(nextMembers);
      setSortedTeamMembers(nextMembers);
    } catch (error) {
      console.error("Fetch Team Members Error:", error);
      toast.error("Failed to load team members.");
      setTeamMembers([]);
      setSortedTeamMembers([]);
    } finally {
      setListLoading(false);
    }
  }, []);
  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const handleEdit = async (memberData) => {
    const memberId = memberData.id || memberData._id || null;
    const scrollToTop = () => {
      const scrollContainer = document.getElementById("admin-scroll-area");
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    };
    const resolveFormData = (data) => {
      const nameValue =
        data.name ||
        data.full_name ||
        data.fullName ||
        data.member_name ||
        data.memberName ||
        data.team?.name ||
        data.data?.name ||
        "";
      const designationValue =
        data.designation ||
        data.title ||
        data.role ||
        data.position ||
        data.team?.designation ||
        data.data?.designation ||
        "";

      setEditMemberName(nameValue);
      setEditMemberId(data.id || data._id || null);
      setFormData({
        name: nameValue,
        designation: designationValue,
        description: data.description || "",
        imageUrl: normalizeImage(data.imageUrl),
        meta_title: data.meta_title || "",
        meta_description: data.meta_description || "",
        meta_keywords: data.meta_keywords || "",
      });
    };

    if (memberId) {
      try {
        const response = await axios.get(`${BASE_URL}/team/id/${memberId}`);
        const member = response.data?.team || response.data?.data || response.data;
        if (member) {
          resolveFormData(member);
          scrollToTop();
          return;
        }
      } catch (error) {
        console.error("Fetch Team Member Error:", error);
      }
    }

    resolveFormData(memberData);
    scrollToTop();
  };

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

      const finalImageUrl =
        formData.imageUrl?.url || formData.imageUrl || "";

      const payload = {
        name: formData.name,
        designation: formData.designation,
        description: formData.description,
        imageUrl: finalImageUrl,
        meta_title: formData.meta_title,
        meta_description: formData.meta_description,
        meta_keywords: formData.meta_keywords,
      };

      let successMessage;

      if (editMemberId) {
        await axios.put(
          `${BASE_URL}/team/id/${encodeURIComponent(editMemberId)}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        successMessage = "Team member updated successfully!";
      } else {
        await axios.post(`${BASE_URL}/team/`, payload, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
        successMessage = "New team member added successfully!";
      }

      toast.success(successMessage);
      handleCancelEdit();
      fetchTeamMembers();
    } catch (error) {
      console.error("Submit Error:", error);
      const msg =
        error.response?.data?.message ||
        `Failed to ${editMemberId ? "update" : "add"} team member`;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (memberId, memberName) => {
    const title = memberName || "This Team Member";

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

    const deleteToastId = toast.loading(`Deleting ${title}...`);
    try {
      const token = getToken();

      await axios.delete(`${BASE_URL}/team/id/${encodeURIComponent(memberId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success(`${title} deleted successfully!`, { id: deleteToastId });
      fetchTeamMembers();
      handleCancelEdit();
    } catch (error) {
      console.error("Delete Error:", error);
      toast.error(
        error.response?.data?.message || `Failed to delete ${title}`,
        {
          id: deleteToastId,
        }
      );
    }
  };

  const handleTeamDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    let nextOrder = [];
    setSortedTeamMembers((items) => {
      const oldIndex = items.findIndex(
        (member) => String(member.id || member.name) === String(active.id)
      );
      const newIndex = items.findIndex(
        (member) => String(member.id || member.name) === String(over.id)
      );
      if (oldIndex === -1 || newIndex === -1) return items;
      nextOrder = arrayMove(items, oldIndex, newIndex);
      return nextOrder;
    });

    if (!nextOrder.length) return;
    try {
      const token = getToken();
      if (!token) {
        toast.error("Authentication required. Please login again.");
        return;
      }
      await axios.post(
        `${BASE_URL}/team/reorder`,
        {
          orderUpdates: nextOrder.map((member, index) => ({
            id: member.id,
            sort_order: index + 1,
          })),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to save team order:", error);
      toast.error("Failed to save team order");
    }
  };

  const SortableTeamRow = ({ member }) => {
    const id = String(member.id || member.name);
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center"
      >
        <div className="flex items-start grow mb-3 sm:mb-0 min-w-0 gap-3">
          <span
            className="mt-1 text-gray-400 cursor-grab select-none"
            {...attributes}
            {...listeners}
            aria-label="Drag handle"
          >
            ⋮⋮
          </span>
          <img
            src={member.imageUrl || "/default-profile.jpg"}
            alt={member.name || member.full_name || member.fullName || "Member"}
            className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-full shrink-0 bg-gray-200"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/default-profile.jpg";
            }}
          />
          <div className="min-w-0">
            <p className="text-base font-semibold truncate">
              {member.name || member.full_name || member.fullName || "Unnamed"}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {member.designation || member.title || ""}
            </p>
            <div
              className="text-xs text-gray-400 mt-1 line-clamp-2"
              dangerouslySetInnerHTML={{
                __html:
                  member.description?.substring(0, 100) +
                  (member.description?.length > 100 ? "..." : ""),
              }}
            />
          </div>
        </div>

        <div className="space-x-4 flex shrink-0">
          <button
            onClick={() => handleEdit(member)}
            className="text-[var(--admin-primary)] hover:text-[var(--admin-primary-strong)] font-medium text-sm"
          >
            Edit
          </button>
          <button
            onClick={() =>
              handleDelete(
                member.id,
                member.name || member.full_name || member.fullName
              )
            }
            className="text-red-600 hover:text-red-900 font-medium text-sm"
          >
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-gray-100 p-4 md:p-6 lg:p-8 flex justify-center">
        <div className="w-full max-w-7xl">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-md mb-10">
            <h1 className="text-xl md:text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
              {editMemberName
                ? `Edit Team Member: ${formData.name}`
                : "Add New Team Member"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-[var(--admin-primary)] text-sm"
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    className="w-full border p-2 rounded focus:outline-[var(--admin-primary)] text-sm"
                    placeholder="Designation"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Description
                </label>
                <RichEditor
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  height="h-64"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">
                  Profile Photo
                </label>
                {formData.imageUrl ? (
                  <div className="mb-3 relative inline-block">
                    <img
                      src={
                        formData.imageUrl.variants?.medium ||
                        formData.imageUrl.url ||
                        formData.imageUrl
                      }
                      alt="Current profile"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, imageUrl: "" }))
                      }
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="w-full h-32 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition text-sm text-gray-500"
                  >
                    Select from Media Library
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className="mt-3 text-xs font-semibold text-[var(--admin-primary)] hover:underline"
                >
                  Choose / Change Photo
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleChange}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="SEO title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    name="meta_keywords"
                    value={formData.meta_keywords}
                    onChange={handleChange}
                    className="w-full border p-2 rounded text-sm"
                    placeholder="keyword1, keyword2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">
                  Meta Description
                </label>
                <textarea
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleChange}
                  className="w-full border p-2 rounded text-sm"
                  rows={3}
                  placeholder="SEO description"
                />
              </div>

              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[var(--admin-primary)] text-white font-bold py-3 rounded hover:bg-[var(--admin-primary-strong)] transition disabled:opacity-50 text-base"
                >
                  {loading
                    ? "Processing..."
                    : editMemberName
                    ? "Update Team Member"
                    : "Add New Team Member"}
                </button>

                {editMemberName && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="sm:w-40 bg-gray-300 text-gray-800 font-bold py-3 rounded hover:bg-gray-400 transition text-base"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 border-b pb-2">
              All Team Members ({sortedTeamMembers.length})
            </h2>

            {listLoading ? (
              <div className="p-4 text-center">Loading team members...</div>
            ) : sortedTeamMembers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No team members found.
              </div>
            ) : (
              <>
                <DndContext
                  collisionDetection={closestCenter}
                  onDragEnd={handleTeamDragEnd}
                >
                  <SortableContext
                    items={sortedTeamMembers.map((member) =>
                      String(member.id || member.name)
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="divide-y divide-gray-200">
                      {sortedTeamMembers.slice(0, visibleCount).map((member) => (
                        <SortableTeamRow
                          key={member.id || member.name}
                          member={member}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
                {sortedTeamMembers.length > visibleCount && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((prev) => prev + 10)
                      }
                      className="px-5 py-2.5 bg-[var(--admin-primary)] hover:bg-[var(--admin-primary-strong)] text-white font-semibold rounded-lg transition"
                    >
                      Load More
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <MediaPickerModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={handlePhotoSelect}
        title="Select Team Photo"
      />
    </>
  );
};

export default TeamMemberAdminPage;
