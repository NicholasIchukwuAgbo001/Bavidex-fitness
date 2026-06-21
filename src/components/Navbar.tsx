/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Dumbbell, ShieldAlert, Award, Grid, Menu, X, Landmark } from "lucide-react";
import { Category } from "../types";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  categories: Category[];
}

export default function Navbar({ currentPath, onNavigate, categories }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isAdminPath = currentPath.startsWith("#/admin");

  return (
    <nav id="bavidex-top-navbar" className="sticky top-0 z-50 bg-black/95 backdrop-blur-md border-b-2 border-red-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo Section */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group"
            onClick={() => {
              onNavigate(isAdminPath ? "#/admin/dashboard" : "#/");
              setIsOpen(false);
            }}
          >
            <div className="bg-red-600 p-2.5 rounded hover:scale-105 active:scale-95 transition-all">
              <Dumbbell className="h-6 w-6 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-xl font-black tracking-widest text-white uppercase font-sans">
                  Bavidex
                </span>
                <span className="text-xs bg-red-600/20 text-red-500 px-1.5 py-0.5 rounded font-black uppercase text-[10px] border border-red-500/30">
                  NG
                </span>
              </div>
              <p className="text-[10px] tracking-[0.25em] text-gray-400 font-medium uppercase mt-0.5">
                FITNESS SHOWROOM
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            {isAdminPath ? (
              <>
                <button
                  onClick={() => onNavigate("#/admin/categories")}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
                    currentPath === "#/admin/categories" ? "text-red-500" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Manage Categories Panel
                </button>

                <button
                  onClick={() => onNavigate("#/admin/products")}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
                    currentPath === "#/admin/products" ? "text-red-500" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Manage Showroom Stock
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onNavigate("#/")}
                  className={`text-sm font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
                    currentPath === "#/" ? "text-red-500" : "text-gray-300 hover:text-white"
                  }`}
                >
                  Showroom Home
                </button>

                {/* Quick Categories dropdown list link */}
                <div className="relative group">
                  <button
                    className={`text-sm font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer flex items-center space-x-1 ${
                      currentPath.startsWith("#/categories") ? "text-red-500" : "text-gray-300 hover:text-white"
                    }`}
                  >
                    <span>Equipment Categories</span>
                    <Grid className="h-4 w-4 text-red-600" />
                  </button>
                  
                  {/* Dropdown Container */}
                  <div className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded shadow-2xl p-2 hidden group-hover:block transition-all duration-300">
                    <div className="grid grid-cols-1 gap-1 text-xs text-neutral-400 font-bold uppercase tracking-wider px-2 py-1.5 border-b border-neutral-800">
                      Select Showroom Category
                    </div>
                    <div className="mt-1 flex flex-col max-h-80 overflow-y-auto">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => onNavigate(`#/categories/${cat.slug}`)}
                          className="w-full text-left px-3 py-2.5 rounded text-xs hover:bg-neutral-800 hover:text-white transition-colors flex items-center justify-between"
                        >
                          <span>{cat.name}</span>
                          <span className="text-[10px] bg-red-600/10 text-red-500 px-1 py-0.2 rounded border border-red-500/20">
                            View
                          </span>
                        </button>
                      ))}
                      {categories.length === 0 && (
                        <div className="text-sm p-3 text-center text-neutral-500 font-medium italic">
                          No categories loaded
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-neutral-900 p-2 rounded text-gray-400 hover:text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-red-500"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-neutral-950 border-t border-neutral-900 px-2 pt-2 pb-4 space-y-1 sm:px-3">
          {isAdminPath ? (
            <>
              <button
                onClick={() => {
                  onNavigate("#/admin/categories");
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-3 rounded text-base font-bold uppercase tracking-widest ${
                  currentPath === "#/admin/categories" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                Manage Categories Panel
              </button>
              <button
                onClick={() => {
                  onNavigate("#/admin/products");
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-3 rounded text-base font-bold uppercase tracking-widest ${
                  currentPath === "#/admin/products" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                Manage Showroom Stock
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  onNavigate("#/");
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-3 py-3 rounded text-base font-bold uppercase tracking-widest ${
                  currentPath === "#/" ? "bg-red-600 text-white" : "text-gray-300 hover:bg-neutral-900 hover:text-white"
                }`}
              >
                Showroom Home
              </button>

              <div className="pt-2 pb-1 border-t border-neutral-900 font-bold text-gray-400 text-xs uppercase px-3 tracking-wider">
                Equipment Categories
              </div>
              
              <div className="max-h-56 overflow-y-auto pl-3 space-y-1">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      onNavigate(`#/categories/${cat.slug}`);
                      setIsOpen(false);
                    }}
                    className={`block w-full text-left px-3 py-2 rounded text-sm font-medium ${
                      currentPath === `#/categories/${cat.slug}` ? "text-red-500" : "text-gray-400 hover:text-white"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
