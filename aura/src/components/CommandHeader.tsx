"use client";

import { motion } from "framer-motion";
import { format } from "date-fns";
import { Orbit } from "lucide-react";
import { useEffect, useState } from "react";

export function CommandHeader() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const date = mounted ? format(new Date(), "dd MMM yyyy") : "";

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex items-center justify-between py-6 px-8 border-b border-aura-border bg-aura-bg/50 backdrop-blur-md sticky top-0 z-50"
    >
      <div className="flex items-center gap-4">
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_-5px_rgba(99,102,241,0.8)]">
          <Orbit className="text-white w-4 h-4" />
        </div>
        <h1 className="text-xl font-medium tracking-tight">The NEOD</h1>
      </div>

      <div className="flex items-center gap-6 text-sm text-aura-text-secondary">
        <span>{date}</span>
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-2 h-2 rounded-full bg-aura-green"
          />
          <span className="text-aura-green font-medium">Live Connection</span>
        </div>
      </div>
    </motion.header>
  );
}
