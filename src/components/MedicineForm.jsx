import React, { useEffect, useState } from "react";
import { createMedicine, updateMedicine, uploadImage } from "../api.js";

export default function MedicineForm({ onCreated, onUpdated, initial }) {
  const [name, setName] = useState("");
  const [benefits, setBenefits] = useState("");
  const [mrp, setMrp] = useState("");
  const [price, setPrice] = useState("");
  const [gst, setGst] = useState("");
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [expiry, setExpiry] = useState("NA");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [available, setAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name || "");
      setBenefits(initial.benefits || "");
      setMrp(String(initial.mrp ?? ""));
      setPrice(String(initial.price ?? ""));
      setGst(String(initial.gst ?? ""));
      setDeliveryCharge(String(initial.deliveryCharge ?? ""));
      setExpiry(initial.expiry || "NA");
      setAvailable(!!initial.available);
      setImageUrl(initial.imageUrl || "");
      setPreview(initial.imageUrl || "");
      setFile(null);
      setSuccess("");
    } else {
      setName("");
      setBenefits("");
      setMrp("");
      setPrice("");
      setGst("");
      setDeliveryCharge("");
      setExpiry("NA");
      setAvailable(true);
      setImageUrl("");
      setPreview("");
      setFile(null);
      setSuccess("");
    }
  }, [initial]);

  function handleFileChange(e) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      validateAndSetFile(selectedFile);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      validateAndSetFile(droppedFile);
    }
  }

  function validateAndSetFile(selectedFile) {
    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }
    if (selectedFile.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller");
      return;
    }
    setError("");
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(selectedFile);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!name.trim()) {
      setError("Product name is required");
      return;
    }
    if (!benefits.trim()) {
      setError("Description is required");
      return;
    }
    if (!mrp || Number(mrp) <= 0) {
      setError("Valid MRP is required");
      return;
    }
    if (!price || Number(price) <= 0) {
      setError("Valid Price is required");
      return;
    }
    if (!gst || Number(gst) < 0 || Number(gst) > 100) {
      setError("GST must be between 0 and 100");
      return;
    }
    if (!deliveryCharge || Number(deliveryCharge) < 0) {
      setError("Valid delivery charge is required");
      return;
    }
    if (!expiry.trim()) {
      setError("Expiry is required (use NA if no expiry)");
      return;
    }
    // Validate expiry format (DD-MM-YYYY or NA)
    if (expiry.trim().toUpperCase() !== "NA") {
      const expiryPattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
      if (!expiryPattern.test(expiry.trim())) {
        setError("Expiry must be in DD-MM-YYYY format or NA");
        return;
      }
    }
    if (!file && !imageUrl) {
      setError("Image is required");
      return;
    }
    if (file && file.size > 2 * 1024 * 1024) {
      setError("Image must be 2MB or smaller");
      return;
    }

    setSubmitting(true);
    try {
      let uploadedImageUrl = imageUrl; // Start with existing image URL
      
      if (file) {
        setUploadProgress(30);
        const up = await uploadImage(file);
        uploadedImageUrl = up.url;
        setUploadProgress(80);
      }

      if (initial && initial._id) {
        const body = { 
          name: name.trim(), 
          benefits: benefits.trim(), 
          mrp: Number(mrp),
          price: Number(price), 
          gst: Number(gst), 
          deliveryCharge: Number(deliveryCharge),
          expiry: expiry.trim().toUpperCase() === "NA" ? "NA" : expiry.trim(),
          available 
        };
        if (uploadedImageUrl) {
          body.imageUrl = uploadedImageUrl;
        }
        await updateMedicine(initial._id, body);
        setSuccess("Product updated successfully!");
        if (onUpdated) onUpdated();
      } else {
        if (!uploadedImageUrl) {
          setError("Image upload failed");
          return;
        }
        await createMedicine({ 
          name: name.trim(), 
          benefits: benefits.trim(), 
          mrp: Number(mrp),
          price: Number(price), 
          gst: Number(gst), 
          deliveryCharge: Number(deliveryCharge),
          expiry: expiry.trim().toUpperCase() === "NA" ? "NA" : expiry.trim(),
          imageUrl: uploadedImageUrl, 
          available 
        });
        setSuccess("Product added successfully!");
        // Reset all form fields
        setName("");
        setBenefits("");
        setMrp("");
        setPrice("");
        setGst("");
        setDeliveryCharge("");
        setExpiry("NA");
        setFile(null);
        setPreview("");
        setImageUrl("");
        setAvailable(true);
        setUploadProgress(0);
        // Clear file input
        const fileInput = document.getElementById("file-input");
        if (fileInput) fileInput.value = "";
        if (onCreated) onCreated();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      setError(err.message || "Failed to save product");
    } finally {
      setSubmitting(false);
      setUploadProgress(0);
    }
  }

  return (
    <form onSubmit={onSubmit} className="medicine-form">
      {/* Image Upload Section */}
      <div className="form-group">
        <label className="form-label">Product Image *</label>
        <div
          className={`image-upload-zone ${dragOver ? "drag-over" : ""} ${preview ? "has-preview" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !preview && document.getElementById("file-input").click()}
        >
          {preview ? (
            <div className="preview-container">
              <img src={preview} alt="Preview" className="preview-image" />
              <button type="button" className="change-image-btn" onClick={(e) => {
                e.stopPropagation();
                document.getElementById("file-input").click();
              }}>
                Change Image
              </button>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon">📸</div>
            <div className="upload-text">
              <div className="upload-title">Drop image here or click to upload</div>
              <div className="upload-subtitle">PNG, JPG, WEBP up to 2MB</div>
            </div>
          </div>
        )}
        <input
          id="file-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: "none" }}
          required={!initial}
        />
        </div>
      </div>

      {/* Form Fields */}
      <div className="form-group">
        <label className="form-label">Product Name *</label>
        <input
          className="input form-input"
          placeholder="e.g., Laptop, Book, Furniture"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label className="form-label">Description *</label>
        <textarea
          className="textarea form-textarea"
          placeholder="Describe the product details and features..."
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
          rows={4}
          required
        />
        <div className="char-count">{benefits.length}/500</div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">MRP (₹) *</label>
          <input
            className="input form-input"
            placeholder="0.00"
            type="number"
            min="0"
            step="0.01"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Price (₹) *</label>
          <input
            className="input form-input"
            placeholder="0.00"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">GST (%) *</label>
          <input
            className="input form-input"
            placeholder="0"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Delivery Charge (₹) *</label>
          <input
            className="input form-input"
            placeholder="0.00"
            type="number"
            min="0"
            step="0.01"
            value={deliveryCharge}
            onChange={(e) => setDeliveryCharge(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label className="form-label">Expiry (DD-MM-YYYY) *</label>
          <input
            className="input form-input"
            placeholder="DD-MM-YYYY or NA"
            type="text"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            required
          />
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            Format: DD-MM-YYYY (e.g., 31-12-2025) or NA for no expiry
          </div>
        </div>
      </div>

      <div className="form-row">
        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="checkbox"
            />
            <span className="checkbox-text">Available</span>
          </label>
        </div>
      </div>

      {/* Upload Progress */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>
          <span>{success}</span>
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn form-submit-btn"
        type="submit"
        disabled={submitting}
      >
        {submitting ? "Saving..." : initial ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}