/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Landmark, Phone, Mail, Clock, ShieldCheck, Dumbbell } from "lucide-react";

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer id="bavidex-bottom-footer" className="bg-black border-t border-neutral-800 text-gray-400 py-12 mt-auto font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-neutral-900">

          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="bg-red-600 p-1.5 rounded">
                <Dumbbell className="h-4 w-4 text-white" />
              </div>
              <span className="text-white text-lg font-black tracking-widest uppercase">
                BAVIDEX FITNESS
              </span>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed font-sans">
              "Your one-stop fitness store for all your sports and fitness equipment."
            </p>
            <div className="text-xs text-neutral-500">
              © {new Date().getFullYear()} Bavidex Fitness Store Nigeria. All Rights Reserved.
            </div>
          </div>

          {/* Showroom Contact Coordinates */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-red-500 font-sans">
              Lagos Flagship Showroom
            </h4>
            <ul className="text-sm space-y-2">
              <li className="flex items-start space-x-2.5">
                <Landmark className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
                <span>Plot 12, Ikorodu Road, Jibowu, Lagos State, Nigeria.</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Phone className="h-4 w-4 text-neutral-500 shrink-0" />
                <span className="font-mono text-xs">+234 (0) 803 123 4567</span>
              </li>
              <li className="flex items-center space-x-2.5">
                <Mail className="h-4 w-4 text-neutral-500 shrink-0" />
                <span className="text-xs">info@bavidexfitness.com.ng</span>
              </li>
            </ul>
          </div>

          {/* Showroom Context Rules (NOT E-Commerce) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-red-500">
              Shopper Warning Notice
            </h4>
            <div className="bg-neutral-950 p-4 border border-neutral-900 rounded space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-red-400">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                <span>Public Showroom Only</span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                This is a secure product showroom catalog. Direct checkout, registration, or web-based transactions are disabled. To purchase, please visit our physical store or call of the representatives directly.
              </p>
            </div>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-600">
          <p>Designed as a premium Gym equipment CMS showcasing absolute performance.</p>
          <button
            onClick={() => onNavigate("#/admin/login")}
            className="mt-2 sm:mt-0 text-neutral-500 hover:text-red-500 transition-colors uppercase font-bold tracking-widest text-[10px]"
          >
            Authorized Store Admin Login
          </button>
        </div>
      </div>
    </footer>
  );
}
