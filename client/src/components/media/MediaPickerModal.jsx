"use client";

import React, { useCallback, useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search, UploadCloud, Check, Trash2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import Cookies from "js-cookie";
import { BASE_URL } from "@/config/Config";

const DEFAULT_LIMIT = 24;

const MediaPickerModal = ({
  open,
  onOpenChange,
  onSelect,
  title = "Select Media",
  initialSearch = "",
  multiple = false,
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [page, setPage] = useState(1);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [brokenItemIds, setBrokenItemIds] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const fetchMedia = useCallback(
    async ({ page: targetPage = 1, replace = false } = {}) => {
      if (!open) return;
      setLoading(true);
      try {
        const endpoint = selectedFolder
          ? `${BASE_URL}/media/folders/assets`
          : `${BASE_URL}/media`;
        const response = await axios.get(endpoint, {
          params: {
            search: debouncedSearch || undefined,
            folder: selectedFolder || undefined,
            page: targetPage,
            limit: DEFAULT_LIMIT,
          },
        });

        const data = response.data?.data || [];
        const meta = response.data?.pagination || {
          page: targetPage,
          limit: DEFAULT_LIMIT,
          total: data.length,
          totalPages: 1,
        };

        setBrokenItemIds([]);
        setMediaItems((prev) => (replace ? data : [...prev, ...data]));
        setPagination(meta);
      } catch (error) {
        console.error("Failed to fetch media:", error);
      } finally {
        setLoading(false);
      }
    },
    [debouncedSearch, open, selectedFolder]
  );

  const fetchFolders = useCallback(async () => {
    if (!open) return;
    setFoldersLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/media/folders`);
      setFolders(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Failed to fetch Cloudinary folders:", error);
      setFolders([]);
    } finally {
      setFoldersLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    fetchFolders();
  }, [fetchFolders, open]);

  useEffect(() => {
    if (!open) return;
    setPage(1);
    fetchMedia({ page: 1, replace: true });
  }, [debouncedSearch, fetchMedia, open, selectedFolder]);

  useEffect(() => {
    if (!open) return;
    setSearch(initialSearch);
    setDebouncedSearch(initialSearch);
    setSelectedFolder("");
    setSelectedItems([]);
  }, [initialSearch, open]);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    setUploading(true);

    const token = Cookies.get("accessToken") || Cookies.get("token");

    try {
      const uploads = await Promise.all(
        acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", file.name);

          const response = await axios.post(`${BASE_URL}/media/upload`, formData, {
            headers: {
              Authorization: token ? `Bearer ${token}` : "",
              "Content-Type": "multipart/form-data",
            },
          });

          return response.data?.data;
        })
      );

      const validUploads = uploads.filter(Boolean);
      if (selectedFolder) {
        setPage(1);
        await fetchMedia({ page: 1, replace: true });
      } else {
        setMediaItems((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          return [...validUploads.filter((item) => !existingIds.has(item.id)), ...prev];
        });
      }
      fetchFolders();
    } catch (error) {
      console.error("Media upload failed:", error);
    } finally {
      setUploading(false);
    }
  }, [fetchFolders, fetchMedia, selectedFolder]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  const hasMore = pagination.page < pagination.totalPages;

  const thumbnailUrl = (item) =>
    item?.variants?.thumbnail || item?.variants?.small || item?.url;

  const getMediaKey = (media) =>
    String(media?.mediaId || media?.id || media?.url || "");

  const toSelectedMedia = (item) => ({
    mediaId: item.id,
    url: item.url,
    variants: item.variants || {},
    title: item.title,
    altText: item.altText || "",
    metaData: item.metaData || {},
  });

  const handleSelectItem = (item) => {
    const media = toSelectedMedia(item);

    if (!multiple) {
      onSelect(media);
      onOpenChange(false);
      return;
    }

    const mediaKey = getMediaKey(media);
    setSelectedItems((prev) => {
      if (prev.some((selected) => getMediaKey(selected) === mediaKey)) {
        return prev.filter((selected) => getMediaKey(selected) !== mediaKey);
      }
      return [...prev, media];
    });
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length === 0) return;
    onSelect(selectedItems);
    onOpenChange(false);
  };

  const handleThumbnailError = (itemId) => {
    setBrokenItemIds((prev) => {
      if (prev.includes(itemId)) return prev;
      return [...prev, itemId];
    });
    setMediaItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchMedia({ page: nextPage });
  };

  const handleDelete = async (event, item) => {
    event.stopPropagation();

    const confirmed = window.confirm(
      "Are you sure you want to delete this image?"
    );
    if (!confirmed) return;

    const token = Cookies.get("accessToken") || Cookies.get("token");
    setDeletingId(item.id);
    try {
      if (String(item.id).startsWith("cloudinary:")) {
        await axios.delete(`${BASE_URL}/media/cloudinary`, {
          data: {
            publicId: item?.metaData?.publicId,
            resourceType: item?.metaData?.resourceType || "image",
          },
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      } else {
        await axios.delete(`${BASE_URL}/media/${item.id}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
      }
      setMediaItems((prev) => prev.filter((media) => media.id !== item.id));
      setPagination((prev) => ({
        ...prev,
        total: Math.max(0, (prev.total || 0) - 1),
      }));
    } catch (error) {
      console.error("Failed to delete media:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-5xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl sm:h-[90dvh] sm:w-[95vw]">
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
            <Dialog.Title className="text-lg font-semibold text-gray-900">
              {title}
            </Dialog.Title>
            <Dialog.Close className="p-2 rounded-full hover:bg-gray-100">
              <X className="w-4 h-4" />
            </Dialog.Close>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search media..."
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              <div
                {...getRootProps()}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-dashed rounded-lg text-sm font-medium cursor-pointer transition ${
                  isDragActive
                    ? "border-blue-400 bg-blue-50 text-blue-600"
                    : "border-gray-200 text-gray-600 hover:border-blue-300"
                }`}
              >
                <input {...getInputProps()} />
                <UploadCloud className="w-4 h-4" />
                {uploading ? "Uploading..." : "Upload"}
              </div>
            </div>

            <div className="shrink-0 space-y-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cloudinary Folders
              </div>
              <div className="max-h-24 overflow-y-auto pr-1 sm:max-h-28">
                <button
                  type="button"
                  onClick={() => setSelectedFolder("")}
                  className={`mb-2 mr-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                    selectedFolder === ""
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                {folders.map((folder) => (
                  <button
                    key={folder}
                    type="button"
                    onClick={() => setSelectedFolder(folder)}
                    className={`mb-2 mr-2 px-3 py-1.5 rounded-full border text-xs font-medium transition ${
                      selectedFolder === folder
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {folder}
                  </button>
                ))}
                {!foldersLoading && folders.length === 0 && (
                  <span className="inline-block text-xs text-gray-500">
                    No folders found.
                  </span>
                )}
                {foldersLoading && (
                  <span className="inline-block text-xs text-gray-500">Loading folders...</span>
                )}
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto pr-1 sm:pr-2">
              {loading && mediaItems.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  Loading media...
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="py-16 text-center text-sm text-gray-500">
                  No media found. Upload something to get started.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mediaItems
                    .filter((item) => !brokenItemIds.includes(item.id))
                    .map((item) => {
                      const isSelected = selectedItems.some(
                        (selected) => getMediaKey(selected) === getMediaKey(item)
                      );
                      return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={multiple ? isSelected : undefined}
                      onClick={() => handleSelectItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectItem(item);
                        }
                      }}
                      className={`group relative overflow-hidden rounded-xl border bg-white transition hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-200 ${
                        isSelected
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-200"
                      } cursor-pointer`}
                    >
                      <div className="aspect-square bg-gray-50">
                        <img
                          src={thumbnailUrl(item)}
                          alt={item.altText || item.title || item.originalName || "Media image"}
                          className="w-full h-full object-contain"
                          onError={() => handleThumbnailError(item.id)}
                        />
                      </div>
                      <div className="px-2 py-2 text-xs text-gray-600 truncate">
                        {item.title || item.originalName}
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition" />
                      <div
                        className={`absolute top-2 right-2 transition ${
                          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white/90 ${
                            isSelected ? "text-blue-600" : "text-green-600"
                          }`}
                        >
                          <Check className="w-4 h-4" />
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={(event) => handleDelete(event, item)}
                        disabled={deletingId === item.id}
                        className="absolute top-2 left-2 inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition hover:bg-white disabled:opacity-60"
                        aria-label={`Delete ${item.title || item.originalName || "media"}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                </div>
              )}
            </div>

            {(hasMore || multiple) && (
              <div className="shrink-0 border-t border-gray-100 pt-3">
                <div
                  className={`flex flex-col gap-2 sm:flex-row sm:items-center ${
                    multiple ? "sm:justify-between" : "sm:justify-center"
                  }`}
                >
                  {multiple ? (
                    <div className="text-sm text-gray-600">
                      {selectedItems.length} selected
                    </div>
                  ) : null}
                  <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                    {hasMore && (
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50 sm:w-auto"
                      >
                        {loading ? "Loading..." : "Load more"}
                      </button>
                    )}
                    {multiple && (
                      <button
                        type="button"
                        onClick={handleConfirmSelection}
                        disabled={selectedItems.length === 0}
                        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        Add selected
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default MediaPickerModal;
