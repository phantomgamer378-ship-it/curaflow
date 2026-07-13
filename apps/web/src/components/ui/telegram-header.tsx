"use client";

import * as React from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface TelegramHeaderProps {
  avatar: string;
  name: string;
  phone: string;
  username: string;
  actionButton?: {
    text: string;
    onClick: () => void;
    backgroundColor?: string;
  };
}

export function TelegramHeader({
  avatar,
  name,
  phone,
  username,
  actionButton = {
    text: "Edit",
    onClick: () => {},
    backgroundColor: "rgb(255,112,0)"
  }
}: TelegramHeaderProps) {
  const [expand, setExpand] = React.useState(false);

  return (
    <MotionConfig
      transition={{
        duration: 0.4,
        type: "spring",
        bounce: 0.2,
      }}
    >
      <div className="relative">
        <AnimatePresence>
          {expand && (
            <motion.button
              className={cn(
                "text-blue-500 absolute z-50 rounded-full px-2 cursor-pointer",
                expand ? "top-[64px] right-2" : "top-0 right-0"
              )}
              initial={{ opacity: 0 }}
              animate={{
                opacity: 1,
                background: expand ? actionButton.backgroundColor : "transparent",
                color: expand ? "rgb(255, 255, 255)" : "rgb(59, 130, 246)",
              }}
              exit={{ opacity: 0 }}
              onClick={actionButton.onClick}
            >
              {actionButton.text}
            </motion.button>
          )}
        </AnimatePresence>

        <motion.header
          layout
          style={{ aspectRatio: expand ? "1/1" : "" }}
          className={cn(
            "relative isolate flex flex-col z-40 bg-white dark:bg-zinc-900 rounded-[34px]",
            expand
              ? "mt-0 items-start justify-end p-4 shadow-xl w-[300px]"
              : "items-center justify-center w-12 h-12"
          )}
        >
          <motion.button
            layoutId="user-avatar"
            className="relative flex aspect-square items-start justify-center overflow-hidden"
            onClick={() => setExpand(!expand)}
            style={{
              borderRadius: expand ? 0 : 34,
              width: expand ? "100%" : "48px",
              height: expand ? "100%" : "48px",
              position: expand ? "absolute" : "relative",
              top: 0,
              left: 0,
              zIndex: -1
            }}
          >
            {avatar ? (
              <Image
                src={avatar}
                alt={name || "User avatar"}
                width={expand ? 400 : 48}
                height={expand ? 400 : 48}
                className="pointer-events-none h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-800 text-gray-500">
                {name ? name.charAt(0) : "U"}
              </div>
            )}
            
            <AnimatePresence>
              {expand && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black/80 to-transparent"
                />
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {expand && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="relative z-20 flex flex-col items-start w-full mt-auto"
              >
                <motion.h2
                  layout
                  className="inline-block text-xl font-medium text-white"
                >
                  {name}
                </motion.h2>
                <motion.div
                  layout
                  className="flex gap-1 text-xs text-gray-300"
                >
                  <p className="tracking-tight">{phone}</p>•
                  <p>{username}</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Overlay to close when clicking outside */}
        <AnimatePresence>
          {expand && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setExpand(false)}
              className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
