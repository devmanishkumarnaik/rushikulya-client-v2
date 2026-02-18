const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeader() {
  const token = localStorage.getItem("auth");
  return token ? { Authorization: token } : {};
}

export async function fetchMedicines() {
  try {
    const res = await fetch(`${API_URL}/medicines`);
    if (!res.ok) {
      console.error("Failed to fetch medicines:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching medicines:", err);
    return [];
  }
}

export async function createMedicine(body) {
  const res = await fetch(`${API_URL}/medicines`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function updateMedicine(id, body) {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeader() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function deleteMedicine(id) {
  const res = await fetch(`${API_URL}/medicines/${id}`, {
    method: "DELETE",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: { ...getAuthHeader() },
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return res.json();
}

export async function verifyAdmin(token) {
  const res = await fetch(`${API_URL}/admin-check`, {
    headers: { Authorization: token },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Unauthorized");
  }
  return res.json();
}

export async function registerSeller(data) {
  const res = await fetch(`${API_URL}/seller/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Registration failed");
  }
  return res.json();
}

export async function loginSeller(data) {
  const res = await fetch(`${API_URL}/seller/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Login failed");
  }
  return res.json();
}

export async function verifySeller(sellerId) {
  const res = await fetch(`${API_URL}/seller/verify/${sellerId}`);
  const data = await res.json();
  if (!res.ok || !data.exists) {
    throw new Error(data.error || "ACCOUNT_DELETED");
  }
  return data;
}

// Admin: Get all sellers
export async function fetchSellers(username, password) {
  const res = await fetch(`${API_URL}/sellers`, {
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch sellers");
  }
  return res.json();
}

// Admin: Update seller
export async function updateSeller(id, data, username, password) {
  const res = await fetch(`${API_URL}/sellers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update seller");
  }
  return res.json();
}

// Admin: Delete seller
export async function deleteSeller(id, username, password) {
  const res = await fetch(`${API_URL}/sellers/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: "Basic " + btoa(`${username}:${password}`),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete seller");
  }
  return res.json();
}

export async function fetchServices() {
  try {
    const res = await fetch(`${API_URL}/services`);
    if (!res.ok) {
      console.error("Failed to fetch services:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching services:", err);
    return [];
  }
}

export async function fetchServiceNames() {
  try {
    const res = await fetch(`${API_URL}/services/names`);
    if (!res.ok) {
      console.error("Failed to fetch service names:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching service names:", err);
    return [];
  }
}

export async function fetchSellerServices(sellerId) {
  try {
    const res = await fetch(`${API_URL}/services/seller/${sellerId}`);
    if (!res.ok) {
      console.error("Failed to fetch seller services:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching seller services:", err);
    return [];
  }
}

export async function createService(data) {
  const res = await fetch(`${API_URL}/services`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create service");
  }
  return res.json();
}

export async function updateService(id, data) {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update service");
  }
  return res.json();
}

export async function deleteService(id) {
  const res = await fetch(`${API_URL}/services/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete service");
  }
  return res.json();
}

export async function fetchProducts() {
  try {
    const res = await fetch(`${API_URL}/products`);
    if (!res.ok) {
      console.error("Failed to fetch products:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching products:", err);
    return [];
  }
}

export async function fetchProductNames() {
  try {
    const res = await fetch(`${API_URL}/products/names`);
    if (!res.ok) {
      console.error("Failed to fetch product names:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching product names:", err);
    return [];
  }
}

export async function fetchSellerProducts(sellerId) {
  try {
    const res = await fetch(`${API_URL}/products/seller/${sellerId}`);
    if (!res.ok) {
      console.error("Failed to fetch seller products:", res.status);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching seller products:", err);
    return [];
  }
}

export async function createProduct(data) {
  const res = await fetch(`${API_URL}/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to create product");
  }
  return res.json();
}

export async function updateProduct(id, data) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to update product");
  }
  return res.json();
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_URL}/products/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to delete product");
  }
  return res.json();
}

// Admin: Fetch pending items
export async function fetchPendingItems() {
  const res = await fetch(`${API_URL}/admin/pending-items`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch pending items");
  }
  return res.json();
}

// Admin: Fetch all items (approved, pending, rejected)
export async function fetchAllItemsAdmin() {
  const res = await fetch(`${API_URL}/admin/all-items`, {
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to fetch all items");
  }
  return res.json();
}

// Admin: Approve product
export async function approveProduct(id) {
  const res = await fetch(`${API_URL}/admin/products/${id}/approve`, {
    method: "PUT",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to approve product");
  }
  return res.json();
}

// Admin: Reject product
export async function rejectProduct(id) {
  const res = await fetch(`${API_URL}/admin/products/${id}/reject`, {
    method: "PUT",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reject product");
  }
  return res.json();
}

// Admin: Approve service
export async function approveService(id) {
  const res = await fetch(`${API_URL}/admin/services/${id}/approve`, {
    method: "PUT",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to approve service");
  }
  return res.json();
}

// Admin: Reject service
export async function rejectService(id) {
  const res = await fetch(`${API_URL}/admin/services/${id}/reject`, {
    method: "PUT",
    headers: { ...getAuthHeader() },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to reject service");
  }
  return res.json();
}