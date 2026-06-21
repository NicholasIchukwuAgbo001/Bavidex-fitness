/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ArrowUpRight } from "lucide-react";
import { Category } from "../types";
import { motion } from "motion/react";

interface CategoryCardProps {
  key?: any;
  category: Category;
  onNavigate: (path: string) => void;
  productCount: number;
}

export default function CategoryCard({ category, onNavigate, productCount }: CategoryCardProps) {
  // Graceful fallback image if none provided
  const imgUrl = category.image_url || "/images/athlete.svg";

  return (
    <motion.div
      id={`cat-card-${category.id}`}
      onClick={() => onNavigate(`#/categories/${category.slug}`)}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative h-80 w-full overflow-hidden rounded bg-neutral-900 border border-neutral-800 cursor-pointer shadow-lg select-none"
    >
      {/* Background Graphic Zoom-In */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-110"
        style={{ backgroundImage: `url(${imgUrl})` }}
      />

      {/* Absolute Dark Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black via-black/40 to-transparent transition-all duration-300 group-hover:via-black/50" />

      {/* Subtle top red border indicator on hover */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-red-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

      {/* Floating Category Meta tag with subtle scale pulse */}
      <div className="absolute top-4 left-4 z-10">
        <span className="bg-red-600 text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded">
          {productCount} {productCount === 1 ? "Product" : "Products"}
        </span>
      </div>

      <div className="absolute bottom-0 inset-x-0 p-6 z-10 flex flex-col justify-end">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-gray-400 text-[10px] tracking-[0.2em] font-bold uppercase block mb-1">
              Bavidex Catalog
            </span>
            <h3 className="text-xl font-black text-white tracking-wide uppercase transition-colors group-hover:text-red-500">
              {category.name}
            </h3>
          </div>

          <motion.div
            whileTap={{ scale: 0.9 }}
            className="bg-white/10 group-hover:bg-red-600 text-white p-2.5 rounded transition-colors duration-300"
          >
            <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
