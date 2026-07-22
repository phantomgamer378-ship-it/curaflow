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
      <motion.button
        className={cn(
          "text-blue-500 absolute z-30 rounded-full px-2 cursor-pointer",
          expand ? "top-[64px]" : ""
        )}
        initial={{ right: 0 }}
        animate={{
          right: expand ? 8 : 0,
          background: expand ? actionButton.backgroundColor : "transparent",
          color: expand ? "rgb(255, 255, 255)" : "rgb(59, 130, 246)",
        }}
        onClick={actionButton.onClick}
      >
        {actionButton.text}
      </motion.button>

      <motion.header
        layout
        style={{ aspectRatio: expand ? "1/1" : "" }}
        className={cn(
          "relative isolate flex flex-col",
          expand
            ? "mt-0 items-start justify-end p-4"
            : "mt-4 items-center justify-center"
        )}
      >
        <motion.button
          layoutId="user-avatar"
          className="relative flex aspect-square w-16 items-start justify-center overflow-hidden"
          onClick={() => setExpand(!expand)}
          style={{
            borderRadius: 34,
          }}
        >
          <Image
            src={avatar}
            alt={name}
            fill
            className="pointer-events-none h-full w-full object-cover"
          />
        </motion.button>

        <motion.div
          className={`relative z-20 flex flex-col ${expand ? "items-start" : "items-center"}`}
        >
          <motion.h2
            layout
            className="inline-block text-xl font-medium"
            animate={{
              color: expand ? "#ffffff" : "#000000",
            }}
          >
            {name}
          </motion.h2>
          <motion.div
            layout
            className="flex gap-1 text-xs"
            animate={{ color: expand ? "#ffffff" : "#8C8C93" }}
          >
            <p className="tracking-tight">{phone}</p>•
            <p>{username}</p>
          </motion.div>
        </motion.div>

        <AnimatePresence>
          {expand && (
            <motion.button
              layoutId="user-avatar"
              className="absolute inset-0 -z-10 aspect-square overflow-hidden"
              style={{ borderRadius: 0 }}
              onClick={() => setExpand(!expand)}
            >
              <Image
                src={avatar}
                alt={name}
                width={400}
                height={400}
                className="pointer-events-none h-full w-full object-cover"
              />
              <motion.div
                className="absolute bottom-0 left-0 h-24 w-full bg-gradient-to-t from-black/50 to-transparent"
              />
            </motion.button>
          )}
        </AnimatePresence>
      </motion.header>
    </MotionConfig>
  );
}