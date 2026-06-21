/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { uploadToSupabaseStorage } from "../lib/supabaseClient";
import { Camera, Upload, Image, X, RefreshCw, Check, AlertCircle } from "lucide-react";

interface ImageSourceSelectorProps {
  imageUrl: string;
  onImageSelected: (url: string) => void;
  bucket: "categories-images" | "products-images";
  idPrefix: string;
  label?: string;
}

export default function ImageSourceSelector({
  imageUrl,
  onImageSelected,
  bucket,
  idPrefix,
  label = "Visual Asset"
}: ImageSourceSelectorProps) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "success" | "fallback">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Clean up camera stream on unmount or state change
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMessage("");
    setIsCameraActive(true);
    setLoading(true);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setErrorMessage("Could not access camera. Please check permissions or upload from gallery.");
      setIsCameraActive(false);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    setLoading(true);
    setErrorMessage("");

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      // Use the video stream's actual videoWidth/videoHeight for highest quality
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize canvas graphics context");
      
      // Flip horizontal if we had mirrored face, but since ideal facing is rear 'environment', we do direct
      ctx.drawImage(video, 0, 0, width, height);
      
      canvas.toBlob(
        async (blob) => {
          if (!blob) {
            setErrorMessage("Failed to capture picture data.");
            setLoading(false);
            return;
          }
          
          await handleImageProcessing(blob, "jpg");
        },
        "image/jpeg",
        0.85
      );
    } catch (err: any) {
      console.error("Capture failed:", err);
      setErrorMessage("Capture failed: " + err.message);
      setLoading(false);
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setErrorMessage("");
    
    const ext = file.name.split(".").pop() || "jpg";
    await handleImageProcessing(file, ext);
    
    // reset selection so change event fires if selecting same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImageProcessing = async (fileOrBlob: File | Blob, extension: string) => {
    const timestamp = Date.now();
    const fileName = `${idPrefix}-${timestamp}.${extension}`;
    
    try {
      // 1. Try cloud upload to Supabase bucket
      const publicUrl = await uploadToSupabaseStorage(bucket, fileName, fileOrBlob);
      onImageSelected(publicUrl);
      setUploadStatus("success");
      stopCamera();
    } catch (cloudErr) {
      console.warn("Could not save to Supabase bucket. Using elegant Local Base64 fallback.", cloudErr);
      
      // 2. Base64 Fallback
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          onImageSelected(base64);
          setUploadStatus("fallback");
          stopCamera();
        };
        reader.onerror = () => {
          setErrorMessage("Failed to read image visual data.");
        };
        reader.readAsDataURL(fileOrBlob);
      } catch (fallbackErr: any) {
        setErrorMessage("Upload failed: " + fallbackErr.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    onImageSelected("");
    setUploadStatus("idle");
    setErrorMessage("");
    stopCamera();
  };

  return (
    <div id={`${idPrefix}-uploader-container`} className="space-y-3 font-sans">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-gray-400">
          {label}
        </label>
        {imageUrl && (
          <button
            type="button"
            onClick={clearImage}
            className="text-[10px] uppercase tracking-wider text-red-500 hover:text-red-400 font-bold flex items-center space-x-1"
          >
            <X className="h-3 w-3" />
            <span>Remove Image</span>
          </button>
        )}
      </div>

      {/* Primary preview / camera feed area */}
      <div className="relative min-h-[180px] w-full rounded border border-neutral-800 bg-neutral-950 flex flex-col items-center justify-center overflow-hidden transition-all duration-300">
        {isCameraActive ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-h-[250px] object-cover"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <RefreshCw className="h-6 w-6 text-red-500 animate-spin" />
              </div>
            )}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-3 px-4">
              <button
                type="button"
                onClick={capturePhoto}
                disabled={loading}
                className="bg-red-600 hover:bg-red-700 disabled:bg-neutral-800 text-white font-black text-xs uppercase tracking-widest px-4 py-2 rounded shadow-lg transition-all flex items-center space-x-1.5"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Snap Pic</span>
              </button>
              <button
                type="button"
                onClick={stopCamera}
                disabled={loading}
                className="bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-bold text-xs uppercase tracking-widest px-4 py-2 rounded transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="relative w-full group">
            <img
              src={imageUrl}
              alt="Visual asset preview"
              className="w-full max-h-[220px] object-contain bg-neutral-900/40 p-1"
              referrerPolicy="no-referrer"
            />
            
            <div className="absolute bottom-2 right-2 bg-neutral-950/80 backdrop-blur-sm border border-neutral-800/80 rounded px-2.5 py-1 text-[9px] font-mono tracking-wider text-neutral-400">
              {imageUrl.startsWith("data:") ? (
                <span className="text-amber-500 font-bold">Local Base64 Storage File</span>
              ) : (
                <span className="text-emerald-500 font-bold flex items-center gap-1">
                  <Check className="h-2.5 w-2.5 inline" /> Cloud Supabase File
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-neutral-900/80 border border-neutral-800 flex items-center justify-center text-neutral-500">
              <Image className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <p className="text-xs font-bold text-neutral-300">No Image Selected</p>
              <p className="text-[10px] text-neutral-500 max-w-[200px] leading-relaxed">
                Provide visual assets for your fitness catalogue using device media source inputs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                type="button"
                onClick={triggerFileSelect}
                disabled={loading}
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded transition-all flex items-center justify-center space-x-1.5"
              >
                <Upload className="h-3.5 w-3.5 text-neutral-400" />
                <span>Device Gallery</span>
              </button>
              
              <button
                type="button"
                onClick={startCamera}
                disabled={loading}
                className="bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 text-xs font-bold uppercase tracking-widest py-2.5 px-4 rounded transition-all flex items-center justify-center space-x-1.5"
              >
                <Camera className="h-3.5 w-3.5 text-red-500 group-hover:text-white" />
                <span>Snap Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for native device gallery access */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Feedback banner */}
      {errorMessage && (
        <div className="p-2.5 bg-red-950/40 border border-red-900/50 rounded flex items-start space-x-2 text-[11px] text-red-400 leading-normal">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

    </div>
  );
}
