"use client"

import { motion } from "framer-motion"

/**
 * Animated neon‑green background used across the app.
 */
export default function BackgroundGlow() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Central radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,170,0.15)_0%,rgba(0,255,170,0.08)_25%,rgba(0,255,170,0.03)_50%,transparent_70%)]" />

      {/* Animated flowing streams */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: [
            "radial-gradient(ellipse_800px_400px_at_20%_30%, rgba(0,255,170,0.1), transparent)",
            "radial-gradient(ellipse_800px_400px_at_80%_70%, rgba(0,255,170,0.1), transparent)",
            "radial-gradient(ellipse_800px_400px_at_40%_80%, rgba(0,255,170,0.1), transparent)",
            "radial-gradient(ellipse_800px_400px_at_60%_20%, rgba(0,255,170,0.1), transparent)",
            "radial-gradient(ellipse_800px_400px_at_20%_30%, rgba(0,255,170,0.1), transparent)",
          ],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Pulsing edge glows */}
      <motion.div
        className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#00FFAA] to-transparent opacity-30"
        animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute bottom-0 right-0 w-full h-px bg-gradient-to-l from-transparent via-[#00FFAA] to-transparent opacity-30"
        animate={{ opacity: [0.2, 0.6, 0.2], scaleX: [0.8, 1.2, 0.8] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
      />

      {/* Corner accent glows */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(0,255,170,0.08),transparent_70%)]"
        animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.8, 1.1, 0.8] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
    </div>
  )
}