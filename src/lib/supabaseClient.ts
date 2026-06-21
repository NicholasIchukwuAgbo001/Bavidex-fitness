/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from "@supabase/supabase-js";
import { Category, Product, SupabaseConfigStatus } from "../types";
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from "./defaultData";

// Retrieve config from VITE_ environment variables or absolute fallback credentials provided in prompt
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "https://nabkcbowygnyvnpplsvb.supabase.co").trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_96c6Bd56ZcHxOVcjigl_0A_1DBuRzhK").trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Define local storage keys
const CATEGORIES_KEY = "bavidex_gym_categories";
const PRODUCTS_KEY = "bavidex_gym_products";

// Synchronous status monitoring
let configStatus: SupabaseConfigStatus = {
  connected: false,
  usingFallback: true,
  error: "Initializing..."
};

export function getSupabaseStatus(): SupabaseConfigStatus {
  return configStatus;
}

// Initial storage setup helper
export function getLocalStorageData() {
  let storedCategories: Category[] = [];
  let storedProducts: Product[] = [];

  const MOCK_IDS = new Set([
    "cat-1eb1-460d-95cf-0105dc1122a1",
    "cat-2eb1-460d-95cf-0105dc1122a2",
    "cat-3eb1-460d-95cf-0105dc1122a3",
    "cat-4eb1-460d-95cf-0105dc1122a4",
    "cat-5eb1-460d-95cf-0105dc1122a5",
    "cat-6eb1-460d-95cf-0105dc1122a6",
    "prod-1111-46cd-af21-9988ccaa1111",
    "prod-1111-46cd-af21-9988ccaa1112",
    "prod-1111-46cd-af21-9988ccaa1113",
    "prod-2222-4cd8-bf52-9988ccaa2221",
    "prod-2222-4cd8-bf52-9988ccaa2222",
    "prod-3333-5cf3-bf52-9988ccaa3331",
    "prod-3333-5cf3-bf52-9988ccaa3332",
    "prod-4444-6a8b-af23-9988ccaa4441",
    "prod-4444-6a8b-af23-9988ccaa4442",
    "prod-5555-5dc8-af11-9988ccaa5551",
    "prod-5555-5dc8-af11-9988ccaa5552",
    "prod-6666-6eb3-af78-9988ccaa6661"
  ]);

  const rawCats = localStorage.getItem(CATEGORIES_KEY);
  if (rawCats) {
    try {
      const parsed = JSON.parse(rawCats);
      storedCategories = Array.isArray(parsed) ? parsed.filter((cat: any) => cat && !MOCK_IDS.has(cat.id)) : [];
    } catch {
      storedCategories = [];
    }
  } else {
    storedCategories = [];
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(storedCategories));
  }

  const rawProds = localStorage.getItem(PRODUCTS_KEY);
  if (rawProds) {
    try {
      const parsed = JSON.parse(rawProds);
      storedProducts = Array.isArray(parsed) ? parsed.filter((prod: any) => prod && !MOCK_IDS.has(prod.id)) : [];
    } catch {
      storedProducts = [];
    }
  } else {
    storedProducts = [];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(storedProducts));
  }

  return { categories: storedCategories, products: storedProducts };
}

// Fetch all categories
export async function fetchCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    configStatus = { connected: true, usingFallback: false };
    const result = data || [];
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(result));
    return result as Category[];
  } catch (err: any) {
    console.warn("Supabase fetchCategories failed. Falling back to Local Storage. Error details:", err);
    configStatus = {
      connected: false,
      usingFallback: true,
      error: err.message || JSON.stringify(err)
    };
    const local = getLocalStorageData();
    return local.categories;
  }
}

// Fetch all products
export async function fetchProducts(): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    configStatus = { ...configStatus, connected: true, usingFallback: false };
    const result = data || [];
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(result));
    return result as Product[];
  } catch (err: any) {
    console.warn("Supabase fetchProducts failed. Falling back to Local Storage. Error details:", err);
    const local = getLocalStorageData();
    return local.products;
  }
}

// Save category
export async function saveCategory(category: Category, isEdit: boolean): Promise<Category> {
  // 1. Commit to Local Storage
  const local = getLocalStorageData();
  let updatedCategories = [...local.categories];

  if (isEdit) {
    updatedCategories = updatedCategories.map(cat => cat.id === category.id ? category : cat);
  } else {
    updatedCategories.push(category);
  }
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));

  // 2. Try writing to Supabase
  try {
    const payload = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      image_url: category.image_url
    };

    if (isEdit) {
      const { error } = await supabase
        .from("categories")
        .update(payload)
        .eq("id", category.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("categories")
        .insert([payload]);
      if (error) throw error;
    }
  } catch (err) {
    console.error("Failed to commit category mutation to Supabase:", err);
    throw err;
  }

  return category;
}

// Delete category
export async function deleteCategory(id: string): Promise<boolean> {
  // 1. Commit to Local Storage
  const local = getLocalStorageData();
  const updatedCategories = local.categories.filter(cat => cat.id !== id);
  const updatedProducts = local.products.filter(prod => prod.category_id !== id);
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCategories));
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

  // 2. Try Supabase
  try {
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to delete category from Supabase:", err);
    throw err;
  }

  return true;
}

// Save product
export async function saveProduct(product: Product, isEdit: boolean): Promise<Product> {
  // 1. Commit to Local Storage
  const local = getLocalStorageData();
  let updatedProducts = [...local.products];

  if (isEdit) {
    updatedProducts = updatedProducts.map(prod => prod.id === product.id ? product : prod);
  } else {
    updatedProducts.push(product);
  }
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

  // 2. Try Supabase
  try {
    const payload = {
      id: product.id,
      category_id: product.category_id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      available: product.available
    };

    if (isEdit) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", product.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("products")
        .insert([payload]);
      if (error) throw error;
    }
  } catch (err) {
    console.error("Failed to commit product mutation to Supabase:", err);
    throw err;
  }

  return product;
}

// Delete product
export async function deleteProduct(id: string): Promise<boolean> {
  // 1. Commit to Local Storage
  const local = getLocalStorageData();
  const updatedProducts = local.products.filter(prod => prod.id !== id);
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(updatedProducts));

  // 2. Try Supabase
  try {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id);
    if (error) throw error;
  } catch (err) {
    console.error("Failed to delete product from Supabase:", err);
    throw err;
  }

  return true;
}

// Helper to convert base64 data URL to standard Blob
export function dataURLtoBlob(dataurl: string): Blob {
  try {
    const arr = dataurl.split(",");
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (err) {
    console.error("Failed to parse base64 data URL to Blob:", err);
    throw new Error("Invalid base64 image data");
  }
}

// Upload file to Supabase Storage
export async function uploadToSupabaseStorage(
  bucket: "categories-images" | "products-images",
  fileName: string,
  file: File | Blob
): Promise<string> {
  const mimeType = file.type || (fileName.endsWith(".png") ? "image/png" : "image/jpeg");
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true,
      contentType: mimeType,
    });

  if (error) {
    throw error;
  }

  const { data: publicData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName);

  if (!publicData || !publicData.publicUrl) {
    throw new Error("Failed to construct Public URL from Supabase Storage");
  }

  return publicData.publicUrl;
}

/**
 * Resolves an image URL: if it's a base64 data URL, uploads it to Supabase storage 
 * and returns the public CDN URL. Otherwise, returns the original URL.
 */
export async function ensureCloudUrl(
  bucket: "categories-images" | "products-images",
  idPrefix: string,
  urlOrBase64: string
): Promise<string> {
  if (!urlOrBase64) return "";
  if (urlOrBase64.startsWith("data:")) {
    try {
      const blob = dataURLtoBlob(urlOrBase64);
      // Derive extension from MIME type
      const extension = blob.type.split("/")[1] || "jpg";
      const timestamp = Date.now();
      const fileName = `${idPrefix}-ensure-${timestamp}.${extension}`;
      return await uploadToSupabaseStorage(bucket, fileName, blob);
    } catch (err) {
      console.error("Failed to upload base64 image to Supabase storage during save:", err);
      throw new Error("Could not upload image to Supabase Storage: " + (err instanceof Error ? err.message : String(err)));
    }
  }
  return urlOrBase64;
}

