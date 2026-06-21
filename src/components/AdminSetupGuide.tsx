/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Copy, Check, Terminal, ExternalLink, RefreshCw, Database, Radio, Sparkles } from "lucide-react";
import { getSupabaseStatus } from "../lib/supabaseClient";

interface AdminSetupGuideProps {
  onCheckStatus: () => void;
  statusLogs?: string;
}

export default function AdminSetupGuide({ onCheckStatus, statusLogs }: AdminSetupGuideProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"sql" | "buckets">("sql");
  const status = getSupabaseStatus();

  const handleCopySQL = () => {
    navigator.clipboard.writeText(postgresSQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const postgresSQL = `-- =======================================================
-- BAVIDEX FITNESS CMS - DATABASE INITIALIZATION SCHEMA
-- =======================================================
-- Execute this script in your Supabase SQL Editor to provision tables,
-- foreign keys, Row Level Security context, and Storage Buckets!

-- 1. Create Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create Products Table
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  image_url TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 4. Create Public READ Policies (Allow anonymous Select query)
DROP POLICY IF EXISTS "Allow public select on categories" ON categories;
CREATE POLICY "Allow public select on categories" 
  ON categories FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Allow public select on products" ON products;
CREATE POLICY "Allow public select on products" 
  ON products FOR SELECT 
  USING (true);

-- 5. Create Admin ALL Admin Policies
DROP POLICY IF EXISTS "Allow admin full access on categories" ON categories;
CREATE POLICY "Allow admin full access on categories" 
  ON categories FOR ALL 
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow admin full access on products" ON products;
CREATE POLICY "Allow admin full access on products" 
  ON products FOR ALL 
  USING (true)
  WITH CHECK (true);

-- 6. Setup Public Storage Buckets (if they don't exist yet)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('categories-images', 'categories-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('products-images', 'products-images', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Grant Storage Policies on storage.objects for anonymous upload/select/delete/edit
DROP POLICY IF EXISTS "All public access to categories images" ON storage.objects;
CREATE POLICY "All public access to categories images"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'categories-images')
  WITH CHECK (bucket_id = 'categories-images');

DROP POLICY IF EXISTS "All public access to products images" ON storage.objects;
CREATE POLICY "All public access to products images"
  ON storage.objects FOR ALL
  TO public
  USING (bucket_id = 'products-images')
  WITH CHECK (bucket_id = 'products-images');

-- =======================================================
-- Schema & Storage Policies Provisioning Complete!
-- =======================================================`;

  return (
    <div id="admin-setup-guide" className="bg-neutral-900 border border-neutral-800 rounded p-4 sm:p-6 text-white font-sans max-w-4xl mx-auto shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b border-neutral-800 mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-red-500 shrink-0" />
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-wider">
              Supabase Connector Terminal
            </h2>
            <p className="text-xs text-neutral-400">
              Check database sync status or run DB migrations
            </p>
          </div>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center bg-neutral-950 px-3 py-1.5 rounded border border-neutral-800 text-xs flex-1 md:flex-none min-w-0">
            <Radio className={`h-3.5 w-3.5 mr-2 shrink-0 ${status.usingFallback ? "text-amber-500 animate-pulse" : "text-emerald-500 animate-pulse"}`} />
            <span className="font-bold text-neutral-300 truncate">
              {status.usingFallback ? "Fallback (Mock Active)" : "Connected to Supabase"}
            </span>
          </div>
          <button
            onClick={onCheckStatus}
            className="bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest p-2 rounded flex items-center justify-center transition-colors shadow shrink-0"
          >
            <RefreshCw className="h-3 w-3 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {status.usingFallback ? (
        <div className="bg-amber-950/20 border border-amber-900/50 p-4 rounded mb-6 text-xs text-amber-200 leading-relaxed">
          <p className="font-bold mb-1 uppercase tracking-wider">⚠️ Offline Sandbox/Local Storage Fallback Mode Active</p>
          <p>
            Your Supabase backend responded with structural errors, likely because the <strong>categories</strong> and <strong>products</strong> tables have not been created yet in the schema of database <code>nabkcbowygnyvnpplsvb</code>. To resolve this instantly, copy the SQL below, navigate to your Supabase SQL Editor, and paste to run it!
          </p>
        </div>
      ) : (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded mb-6 text-xs text-emerald-200 leading-relaxed flex items-center space-x-3">
          <Sparkles className="h-5 w-5 text-emerald-500 shrink-0" />
          <div>
            <p className="font-bold uppercase tracking-wider">🚀 DATABASE SYNCED SUCCESSFULLY!</p>
            <p>
              Your system has established a real full-stack web connection to the official Supabase tables! All edits, image links, category slugs, and products are saving and loaded dynamically from your PostgreSQL workspace.
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-3 border-b border-neutral-800 mb-4 text-xs font-bold uppercase tracking-widest">
        <button
          onClick={() => setActiveTab("sql")}
          className={`pb-2.5 px-2 transition-colors ${activeTab === "sql" ? "text-red-500 border-b-2 border-red-600" : "text-neutral-500 hover:text-white"}`}
        >
          1. Copy SQL Schema
        </button>
        <button
          onClick={() => setActiveTab("buckets")}
          className={`pb-2.5 px-2 transition-colors ${activeTab === "buckets" ? "text-red-500 border-b-2 border-red-600" : "text-neutral-500 hover:text-white"}`}
        >
          2. Storage Buckets
        </button>
      </div>

      {activeTab === "sql" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-neutral-400">
            <span>SQL Script (PostgreSQL dialect)</span>
            <button
              onClick={handleCopySQL}
              className="bg-neutral-800 hover:bg-neutral-700 text-white font-bold p-1.5 rounded flex items-center space-x-1.5 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-red-500" />}
              <span>{copied ? "Copied SQL!" : "Copy SQL Script"}</span>
            </button>
          </div>

          <div className="relative bg-neutral-950 p-4 rounded border border-neutral-800">
            <pre className="font-mono text-[10px] text-gray-300 overflow-x-auto max-h-72 leading-relaxed whitespace-pre-wrap overflow-wrap-break-word">
              {postgresSQL}
            </pre>
          </div>

          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <Terminal className="h-4 w-4 text-neutral-600 shrink-0" />
            <span>After running this SQL, refresh this CMS dashboard page to launch real-time table syncing immediately.</span>
          </div>
        </div>
      )}

      {activeTab === "buckets" && (
        <div className="space-y-4 text-sm text-neutral-300 leading-relaxed">
          <h3 className="font-bold uppercase tracking-wider text-xs text-red-500">
            Supabase Storage Buckets Setup Guide
          </h3>
          <p className="text-xs">
            To enable uploading of gym equipment photos directly from this admin panel, please do the following:
          </p>
          <ol className="list-decimal pl-5 space-y-2.5 text-xs text-neutral-400">
            <li>
              Go to your <strong className="text-white">Supabase Dashboard</strong>, select your project, and click the <strong className="text-white">Storage</strong> menu in the left panel.
            </li>
            <li>
              Create a new bucket named: <code className="text-red-400 font-mono font-bold bg-neutral-950 px-1 py-0.5 rounded">categories-images</code>
            </li>
            <li>
              Create a second bucket named: <code className="text-red-400 font-mono font-bold bg-neutral-950 px-1 py-0.5 rounded">products-images</code>
            </li>
            <li>
              Ensure both buckets are toggled to <strong className="text-white">Public</strong> so the image URLs can be rendered publicly on client browser screens.
            </li>
            <li>
              Add a storage RLS policy granting <strong className="text-white">select / insert / delete</strong> access to all users (since customers select and admin inserts), or simply disable RLS on the storage bucket if it's isolated for public assets.
            </li>
          </ol>

          <div className="bg-neutral-950 p-4 rounded border border-neutral-850 space-y-2 mt-4">
            <h4 className="text-xs font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
              <span>💡 Fix Storage RLS Policy Instantly</span>
            </h4>
            <p className="text-[11px] text-neutral-400">
              If you receive a <code className="text-red-400">new row violates row-level security policy</code> error when snapping or uploading photos, copy and run the SQL script on Tab 1 inside your Supabase SQL editor. It automatically configures and overrides your storage policies to make both buckets publicly writeable and listable.
            </p>
          </div>

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 bg-red-600/10 border border-red-500/20 text-red-500 px-3 py-1.5 rounded text-xs font-bold hover:bg-red-600 hover:text-white transition-all w-fit mt-2 uppercase tracking-wider"
          >
            <span>Navigate to Supabase Console</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )}
    </div>
  );
}
