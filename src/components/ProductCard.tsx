/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Dumbbell, PackageCheck, AlertCircle } from "lucide-react";
import { Product } from "../types";
import { motion } from "motion/react";

interface ProductCardProps {
  key?: any;
  product: Product;
  categoryName?: string;
}

export default function ProductCard({ product, categoryName }: ProductCardProps) {
  // Format price helper
  const formatPrice = (priceVal: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0
    }).format(priceVal);
  };

  const imgUrl = product.image_url || "/images/dumbbells.svg";
  const isSvg = imgUrl.endsWith(".svg");

  return (
    <motion.div
      id={`prod-card-${product.id}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      className="group bg-neutral-900 border border-neutral-800 rounded overflow-hidden flex flex-col hover:border-neutral-700/60 shadow-xl"
    >
      <div className="relative h-64 overflow-hidden bg-neutral-950 flex items-center justify-center">
        <img
          src={imgUrl}
          alt={product.name}
          referrerPolicy="no-referrer"
          className={`transition-transform duration-500 group-hover:scale-105 ${isSvg
              ? "w-full h-full object-contain p-8 opacity-80"
              : "w-full h-full object-cover object-center"
            }`}
        />

        {/* Soft shadow tint */}
        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent opacity-80" />

        {/* Availability Badge */}
        <div className="absolute top-4 right-4 z-10 flex flex-col items-end space-y-1">
          {product.available ? (
            <span className="bg-emerald-600/95 backdrop-blur-sm text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-emerald-400/20 flex items-center space-x-1">
              <PackageCheck className="h-3 w-3" />
              <span>Instock Showroom</span>
            </span>
          ) : (
            <span className="bg-red-600/95 backdrop-blur-sm text-white font-black text-[10px] uppercase tracking-widest px-2.5 py-1 rounded border border-red-400/20 flex items-center space-x-1">
              <AlertCircle className="h-3 w-3" />
              <span>Out Of Stock - Call to Order</span>
            </span>
          )}
        </div>

        {categoryName && (
          <div className="absolute bottom-4 left-4 z-10">
            <span className="bg-black/80 backdrop-blur-sm text-red-500 font-extrabold text-[9px] uppercase tracking-widest px-2 py-0.5 rounded border border-red-500/20">
              {categoryName}
            </span>
          </div>
        )}
      </div>

      <div className="p-5 flex flex-col grow bg-neutral-900">
        <h3 className="text-sm font-black text-white hover:text-red-500 transition-colors uppercase tracking-wide leading-tight line-clamp-2 h-10 mb-2">
          {product.name}
        </h3>

        <div className="w-full h-px bg-neutral-800/80 my-3" />

        <div className="flex items-center justify-between mt-auto">
          <div>
            <span className="text-gray-500 text-[9px] tracking-[0.15em] font-medium uppercase block">
              Showroom Price
            </span>
            <span className="text-lg font-black text-red-500 tracking-tight">
              {formatPrice(product.price)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest block font-bold">
              Bavidex Certified
            </span>
            <span className="text-[9px] text-gray-400 italic block">
              1-Year Warranty
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
