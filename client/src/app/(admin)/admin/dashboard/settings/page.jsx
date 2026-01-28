"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import MediaPickerModal from "@/components/media/MediaPickerModal";

const page = ({ settingsId }) => {
  const [name, setName] = useState("");
  const [imageURL, setImageURL] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [header, setHeader] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mediaModalOpen, setMediaModalOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3000/settings/${settingsId}`
        );
        const data = response.data;

        if (data.success) {
          setName(data.data.name || "");
          setImageURL(data.data.settings?.image || "");
          setImagePreview(data.data.settings?.image || "");
          setHeader(data.data.settings?.header || "");
        }
      } catch (error) {
        console.error(
          "Error fetching settings:",
          error.response?.data || error.message
        );
        setMessage("Failed to load current settings.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [settingsId]);

  const handleMediaSelect = (media) => {
    const url = media.url || "";
    setImageURL(url);
    setImagePreview(url);
  };

  // Handle URL input change
  const handleURLChange = (e) => {
    setImageURL(e.target.value);
    setImagePreview(e.target.value);
  };

  // Handle update
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const finalImage = imageURL;

      const response = await axios.patch(
        `http://localhost:3000/settings/update?id=${settingsId}`,
        {
          name: name,
          settings: { image: finalImage, header },
        },
        { headers: { "Content-Type": "application/json" } }
      );

      if (response.data.success) {
        setMessage("Settings updated successfully!");
      } else {
        setMessage("Failed to update settings.");
      }
    } catch (error) {
      console.error(
        "Error updating settings:",
        error.response?.data || error.message
      );
      setMessage("Failed to update settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow rounded-md">
      <h2 className="text-xl font-semibold mb-4">Update Settings</h2>

      {loading && <p className="mb-2 text-sm text-gray-500">Loading...</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border px-3 py-2 rounded"
            required
          />
        </div>

        {/* Header */}
        <div>
          <label className="block text-sm font-medium mb-1">Header Text</label>
          <input
            type="text"
            value={header}
            onChange={(e) => setHeader(e.target.value)}
            className="w-full border px-3 py-2 rounded"
          />
          {header && (
            <p className="mt-2 text-lg font-semibold text-gray-700">{header}</p>
          )}
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium mb-1">Image URL</label>
          <input
            type="text"
            value={imageURL}
            onChange={handleURLChange}
            className="w-full border px-3 py-2 rounded"
            placeholder="Enter live image URL"
          />
        </div>

        {/* Image Picker */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Select from Media Library
          </label>
          <button
            type="button"
            onClick={() => setMediaModalOpen(true)}
            className="w-full border border-dashed rounded px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Choose Image
          </button>
        </div>

        {/* Preview */}
        {imagePreview && (
          <div className="mt-2">
            <p className="text-xs text-gray-500 mb-1">Preview:</p>
            <img
              src={imagePreview}
              alt="Preview"
              className="w-full h-48 object-contain border rounded"
            />
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--admin-primary)] text-white py-2 rounded hover:bg-[var(--admin-primary-strong)] transition"
        >
          {loading ? "Saving..." : "Update Settings"}
        </button>

        {message && <p className="mt-2 text-sm">{message}</p>}
      </form>
      <MediaPickerModal
        open={mediaModalOpen}
        onOpenChange={setMediaModalOpen}
        onSelect={handleMediaSelect}
        title="Select Setting Image"
      />
    </div>
  );
};

export default page;
