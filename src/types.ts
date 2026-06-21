/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Category {
  id: string; // uuid
  name: string;
  slug: string;
  image_url: string;
  created_at?: string;
}

export interface Product {
  id: string; // uuid
  category_id: string; // refers to Category.id
  name: string;
  price: number;
  image_url: string;
  available: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseConfigStatus {
  connected: boolean;
  usingFallback: boolean;
  error?: string;
}
