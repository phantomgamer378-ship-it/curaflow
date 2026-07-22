"use strict";
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/config/redis.ts
function getRedisClient() {
  if (!redisClient) {
    const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
    console.log("[Redis Config] Initializing client with URL:", url.includes("@") ? url.split("@")[1] : url);
    redisClient = new import_ioredis.default(url, {
      maxRetriesPerRequest: null
    });
    redisClient.on("connect", () => {
      console.log("[Redis] Client connected successfully.");
    });
    redisClient.on("error", (err) => {
      console.error("[Redis] Client error:", err.message);
    });
  }
  return redisClient;
}
var import_ioredis, redisClient;
var init_redis = __esm({
  "src/config/redis.ts"() {
    "use strict";
    import_ioredis = __toESM(require("ioredis"));
    redisClient = null;
  }
});

// ../../packages/observability/src/index.ts
function createLogger(scope) {
  return {
    info(message, context = {}) {
      console.info(JSON.stringify({ level: "info", scope, message, ...context }));
    },
    error(message, context = {}) {
      console.error(JSON.stringify({ level: "error", scope, message, ...context }));
    }
  };
}
var init_src = __esm({
  "../../packages/observability/src/index.ts"() {
    "use strict";
  }
});

// ../../packages/db/src/index.ts
var src_exports = {};
__export(src_exports, {
  MIGRATIONS_PATH: () => MIGRATIONS_PATH,
  prisma: () => prisma
});
var import_client, prisma, MIGRATIONS_PATH;
var init_src2 = __esm({
  "../../packages/db/src/index.ts"() {
    "use strict";
    import_client = require("@prisma/client");
    __reExport(src_exports, require("@prisma/client"));
    prisma = new import_client.PrismaClient();
    MIGRATIONS_PATH = "packages/db/prisma/migrations";
  }
});

// ../../packages/queue/src/clinic-date.ts
function pad2(value) {
  return String(value).padStart(2, "0");
}
function parseDateKey(dateKey) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    throw new Error(`Invalid clinic date key: ${dateKey}`);
  }
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3])
  };
}
function getParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const read = (type) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (!value) throw new Error(`Missing ${type} while formatting clinic date.`);
    return Number(value);
  };
  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour"),
    minute: read("minute"),
    second: read("second")
  };
}
function getClinicDateKey(date = /* @__PURE__ */ new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  const parts = getParts(date, timeZone);
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
}
function addDaysToClinicDateKey(dateKey, days) {
  const parts = parseDateKey(dateKey);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}
function clinicDateKeyToSessionDate(dateKey) {
  const parts = parseDateKey(dateKey);
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}
function getTimeZoneOffsetMs(instant, timeZone) {
  const parts = getParts(instant, timeZone);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  return localAsUtc - instant.getTime();
}
function clinicDateTimeToUtcDate(dateKey, time = {}, timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  const parts = parseDateKey(dateKey);
  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    time.hour ?? 0,
    time.minute ?? 0,
    time.second ?? 0,
    time.millisecond ?? 0
  );
  let candidate = new Date(localAsUtc);
  for (let i = 0; i < 3; i++) {
    candidate = new Date(localAsUtc - getTimeZoneOffsetMs(candidate, timeZone));
  }
  return candidate;
}
function getClinicDayRange(date = /* @__PURE__ */ new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  const dateKey = getClinicDateKey(date, timeZone);
  const nextDateKey = addDaysToClinicDateKey(dateKey, 1);
  const start = clinicDateTimeToUtcDate(dateKey, {}, timeZone);
  const nextStart = clinicDateTimeToUtcDate(nextDateKey, {}, timeZone);
  return {
    dateKey,
    sessionDate: clinicDateKeyToSessionDate(dateKey),
    start,
    end: new Date(nextStart.getTime() - 1)
  };
}
function getClinicSessionDateForDate(date = /* @__PURE__ */ new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  return clinicDateKeyToSessionDate(getClinicDateKey(date, timeZone));
}
function isSameClinicDay(a, b = /* @__PURE__ */ new Date(), timeZone = DEFAULT_CLINIC_TIME_ZONE) {
  return getClinicDateKey(a, timeZone) === getClinicDateKey(b, timeZone);
}
var DEFAULT_CLINIC_TIME_ZONE;
var init_clinic_date = __esm({
  "../../packages/queue/src/clinic-date.ts"() {
    "use strict";
    DEFAULT_CLINIC_TIME_ZONE = "Asia/Kolkata";
  }
});

// ../../packages/queue/src/index.ts
var src_exports2 = {};
__export(src_exports2, {
  DEFAULT_CLINIC_TIME_ZONE: () => DEFAULT_CLINIC_TIME_ZONE,
  addDaysToClinicDateKey: () => addDaysToClinicDateKey,
  clinicDateKeyToSessionDate: () => clinicDateKeyToSessionDate,
  clinicDateTimeToUtcDate: () => clinicDateTimeToUtcDate,
  getClinicDateKey: () => getClinicDateKey,
  getClinicDayRange: () => getClinicDayRange,
  getClinicSessionDateForDate: () => getClinicSessionDateForDate,
  getLiveQueueSnapshot: () => getLiveQueueSnapshot,
  isSameClinicDay: () => isSameClinicDay,
  joinQueue: () => joinQueue,
  markNoShow: () => markNoShow,
  markPatientDone: () => markPatientDone,
  skipPatient: () => skipPatient,
  startConsultation: () => startConsultation,
  startQueueSession: () => startQueueSession
});
async function getLiveQueueSnapshot(clinicId) {
  const todayDate = getClinicSessionDateForDate();
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: { profile: true }
  });
  const snapshotDoctors = [];
  for (const doc of doctors) {
    const session = await prisma.queueSession.findFirst({
      where: {
        doctorId: doc.id,
        sessionDate: todayDate
      }
    });
    const currentToken = session ? session.currentToken : 0;
    let waitingCount = 0;
    if (session) {
      waitingCount = await prisma.queueEntry.count({
        where: {
          sessionId: session.id,
          status: "waiting"
        }
      });
    }
    snapshotDoctors.push({
      doctor_id: doc.id,
      doctor_name: doc.profile?.name || "Doctor",
      current_token: currentToken,
      waiting_count: waitingCount
    });
  }
  return { doctors: snapshotDoctors };
}
async function getOrCreateSession(doctorId) {
  const todayDate = getClinicSessionDateForDate();
  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });
  if (session) return session;
  return await prisma.queueSession.create({
    data: { doctorId, sessionDate: todayDate }
  });
}
async function startConsultation(input) {
  const session = await getOrCreateSession(input.doctorId);
  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "in_consultation" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "in_consultation",
        joinedAt: /* @__PURE__ */ new Date()
      },
      update: {
        status: "in_consultation"
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "DOCTOR_STARTED_CONSULTATION",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);
}
async function markPatientDone(input) {
  const session = await getOrCreateSession(input.doctorId);
  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "completed" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "completed",
        joinedAt: /* @__PURE__ */ new Date()
      },
      update: {
        status: "completed"
      }
    }),
    prisma.queueSession.update({
      where: { id: session.id },
      data: { currentToken: session.currentToken + 1 }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_COMPLETED",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);
  return getLiveQueueSnapshot(input.clinicId);
}
async function markNoShow(input) {
  const session = await getOrCreateSession(input.doctorId);
  await prisma.$transaction([
    prisma.appointment.update({
      where: { id: input.appointmentId },
      data: { status: "no_show" }
    }),
    prisma.queueEntry.upsert({
      where: { appointmentId: input.appointmentId },
      create: {
        sessionId: session.id,
        appointmentId: input.appointmentId,
        position: 0,
        status: "no_show",
        joinedAt: /* @__PURE__ */ new Date()
      },
      update: {
        status: "no_show"
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "NO_SHOW_MARKED",
        payload: JSON.stringify({ appointmentId: input.appointmentId })
      }
    })
  ]);
  return getLiveQueueSnapshot(input.clinicId);
}
async function startQueueSession(doctorId, clinicId) {
  const todayDate = getClinicSessionDateForDate();
  const existingSession = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });
  if (existingSession) {
    throw new Error("Queue session is already started for today.");
  }
  await prisma.queueSession.create({
    data: { doctorId, sessionDate: todayDate, currentToken: 1 }
  });
  return getLiveQueueSnapshot(clinicId);
}
async function joinQueue(appointmentId, doctorId, clinicId) {
  const todayDate = getClinicSessionDateForDate();
  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });
  if (!session) {
    throw new Error("The doctor has not started the queue session for today yet.");
  }
  const existingEntry = await prisma.queueEntry.findUnique({
    where: { appointmentId }
  });
  if (existingEntry) {
    throw new Error("You have already joined the queue.");
  }
  const positionCount = await prisma.queueEntry.count({
    where: { sessionId: session.id }
  });
  await prisma.$transaction([
    prisma.queueEntry.create({
      data: {
        sessionId: session.id,
        appointmentId,
        position: positionCount + 1,
        status: "waiting"
      }
    }),
    prisma.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_JOINED_QUEUE",
        payload: JSON.stringify({ appointmentId })
      }
    })
  ]);
  return getLiveQueueSnapshot(clinicId);
}
async function skipPatient(appointmentId, doctorId, clinicId) {
  const todayDate = getClinicSessionDateForDate();
  const session = await prisma.queueSession.findFirst({
    where: { doctorId, sessionDate: todayDate }
  });
  if (!session) {
    throw new Error("No active queue session for this doctor today.");
  }
  await prisma.$transaction(async (tx) => {
    const entries = await tx.queueEntry.findMany({
      where: { sessionId: session.id },
      orderBy: { position: "asc" }
    });
    const skippedEntry = entries.find((e) => e.appointmentId === appointmentId);
    if (!skippedEntry) {
      throw new Error("Patient queue entry not found.");
    }
    const otherEntries = entries.filter((e) => e.appointmentId !== appointmentId);
    let pos = 1;
    for (const entry of otherEntries) {
      await tx.queueEntry.update({
        where: { id: entry.id },
        data: { position: pos }
      });
      pos++;
    }
    await tx.queueEntry.update({
      where: { id: skippedEntry.id },
      data: { position: pos }
    });
    await tx.queueEvent.create({
      data: {
        sessionId: session.id,
        type: "PATIENT_SKIPPED",
        payload: JSON.stringify({ appointmentId })
      }
    });
  });
  return getLiveQueueSnapshot(clinicId);
}
var init_src3 = __esm({
  "../../packages/queue/src/index.ts"() {
    "use strict";
    init_src2();
    init_clinic_date();
    init_clinic_date();
  }
});

// src/config/socket.ts
var socket_exports = {};
__export(socket_exports, {
  broadcastAdminStatsUpdate: () => broadcastAdminStatsUpdate,
  broadcastQueueUpdate: () => broadcastQueueUpdate,
  getIO: () => getIO,
  initSockets: () => initSockets
});
function initSockets(server) {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  const pubClient = getRedisClient();
  const subClient = new import_ioredis2.default(url, { maxRetriesPerRequest: null });
  const broadcastSubClient = new import_ioredis2.default(url, { maxRetriesPerRequest: null });
  broadcastSubClient.subscribe("queue_broadcast").catch((err) => {
    logger.error("Failed to subscribe to queue_broadcast channel:", err);
  });
  broadcastSubClient.on("message", async (channel, message) => {
    if (channel === "queue_broadcast") {
      try {
        const payload = JSON.parse(message);
        if (payload.type === "admin_stats") {
          const { clinicId: cId, stats } = payload;
          getIO().to(`clinic:${cId}`).emit("admin_stats_updated", stats);
        } else {
          const { clinicId } = payload;
          const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
          const snapshot = await getLiveQueueSnapshot2(clinicId);
          broadcastQueueUpdate(clinicId, snapshot);
        }
      } catch (err) {
        logger.error("Failed to broadcast from sub client:", err);
      }
    }
  });
  io = new import_socket.Server(server, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
      methods: ["GET", "POST"],
      credentials: true
    }
  });
  io.adapter((0, import_redis_adapter.createAdapter)(pubClient, subClient));
  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on("join_clinic", (clinicId) => {
      socket.join(`clinic:${clinicId}`);
      logger.info(`Socket ${socket.id} joined room clinic:${clinicId}`);
    });
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
  return io;
}
function getIO() {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
}
function broadcastQueueUpdate(clinicId, data) {
  try {
    getIO().to(`clinic:${clinicId}`).emit("queue_updated", data);
    logger.info(`Broadcasted queue update for clinic ${clinicId}`);
  } catch (error) {
    logger.error("Failed to broadcast queue update:", { error: error.message });
  }
}
function broadcastAdminStatsUpdate(clinicId, stats) {
  try {
    getIO().to(`clinic:${clinicId}`).emit("admin_stats_updated", stats);
    const pubClient = getRedisClient();
    pubClient.publish("queue_broadcast", JSON.stringify({ type: "admin_stats", clinicId, stats })).catch(() => {
    });
    logger.info(`Broadcasted admin stats update for clinic ${clinicId}`);
  } catch (error) {
    logger.error("Failed to broadcast admin stats update:", { error: error.message });
  }
}
var import_socket, import_redis_adapter, import_ioredis2, logger, io;
var init_socket = __esm({
  "src/config/socket.ts"() {
    "use strict";
    import_socket = require("socket.io");
    import_redis_adapter = require("@socket.io/redis-adapter");
    import_ioredis2 = __toESM(require("ioredis"));
    init_redis();
    init_src();
    logger = createLogger("sockets");
  }
});

// src/config/queue.ts
var queue_exports = {};
__export(queue_exports, {
  aiQueue: () => aiQueue,
  analyticsQueue: () => analyticsQueue,
  notificationQueue: () => notificationQueue,
  queueQueue: () => queueQueue
});
function getRedisInstance() {
  const url = process.env.UPSTASH_REDIS_URL || "redis://localhost:6379";
  console.log("[BullMQ Queue Config] Initializing Queue Redis client with URL:", url.includes("@") ? url.split("@")[1] : url);
  return new import_ioredis3.default(url, {
    maxRetriesPerRequest: null
  });
}
function getNotificationQueue() {
  if (!notificationQueueInstance) {
    notificationQueueInstance = new import_bullmq.Queue("notification-queue", { connection: getRedisInstance() });
  }
  return notificationQueueInstance;
}
function getQueueQueue() {
  if (!queueQueueInstance) {
    queueQueueInstance = new import_bullmq.Queue("queue-queue", { connection: getRedisInstance() });
  }
  return queueQueueInstance;
}
function getAnalyticsQueue() {
  if (!analyticsQueueInstance) {
    analyticsQueueInstance = new import_bullmq.Queue("analytics-queue", { connection: getRedisInstance() });
  }
  return analyticsQueueInstance;
}
function getAiQueue() {
  if (!aiQueueInstance) {
    aiQueueInstance = new import_bullmq.Queue("ai-queue", { connection: getRedisInstance() });
  }
  return aiQueueInstance;
}
var import_bullmq, import_ioredis3, notificationQueueInstance, queueQueueInstance, analyticsQueueInstance, aiQueueInstance, notificationQueue, queueQueue, analyticsQueue, aiQueue;
var init_queue = __esm({
  "src/config/queue.ts"() {
    "use strict";
    import_bullmq = require("bullmq");
    import_ioredis3 = __toESM(require("ioredis"));
    notificationQueueInstance = null;
    queueQueueInstance = null;
    analyticsQueueInstance = null;
    aiQueueInstance = null;
    notificationQueue = {
      add: (name, data, opts) => getNotificationQueue().add(name, data, opts)
    };
    queueQueue = {
      add: (name, data, opts) => getQueueQueue().add(name, data, opts)
    };
    analyticsQueue = {
      add: (name, data, opts) => getAnalyticsQueue().add(name, data, opts)
    };
    aiQueue = {
      add: (name, data, opts) => getAiQueue().add(name, data, opts)
    };
  }
});

// src/index.ts
var import_dotenv = __toESM(require("dotenv"));
var import_path = __toESM(require("path"));
var import_express9 = __toESM(require("express"));
var import_http = require("http");
var import_cors = __toESM(require("cors"));
var import_helmet = __toESM(require("helmet"));
init_socket();

// src/middleware/error.ts
init_src();
var logger2 = createLogger("error-handler");
function errorHandler(err, req, res, next) {
  logger2.error("Unhandled API Error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  return res.status(statusCode).json({
    ok: false,
    error: message,
    details: process.env.NODE_ENV === "development" ? err.stack : void 0
  });
}

// src/index.ts
init_src();

// src/modules/auth/auth.router.ts
var import_express = require("express");

// src/modules/auth/auth.controller.ts
var import_bcryptjs = __toESM(require("bcryptjs"));
var import_jsonwebtoken = __toESM(require("jsonwebtoken"));

// src/config/db.ts
init_src2();

// src/modules/auth/auth.controller.ts
init_queue();

// src/modules/auth/crypto.ts
var import_crypto = require("crypto");
function generateToken() {
  const raw = (0, import_crypto.randomBytes)(32).toString("hex");
  const hash = (0, import_crypto.createHash)("sha256").update(raw).digest("hex");
  return { raw, hash };
}
function hashToken(raw) {
  return (0, import_crypto.createHash)("sha256").update(raw).digest("hex");
}

// src/modules/auth/auth.controller.ts
var import_google_auth_library = require("google-auth-library");
function getGoogleClient() {
  return new import_google_auth_library.OAuth2Client(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
  );
}
async function signup(req, res, next) {
  try {
    const { email, password, name, role = "patient", phone } = req.body;
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, error: "Email is already registered" });
    }
    const passwordHash = import_bcryptjs.default.hashSync(password, 10);
    const profile = await prisma.$transaction(async (tx) => {
      const newProfile = await tx.profile.create({
        data: {
          email,
          passwordHash,
          name,
          role,
          phone
        }
      });
      if (role === "doctor") {
        let clinic = await tx.clinic.findFirst();
        if (!clinic) {
          clinic = await tx.clinic.create({
            data: { name: "Main Clinic", openTime: "09:00", closeTime: "17:00" }
          });
        }
        await tx.doctor.create({
          data: { profileId: newProfile.id, clinicId: clinic.id, specialty: "General" }
        });
      } else {
        await tx.patient.create({
          data: {
            profileId: newProfile.id
          }
        });
      }
      return newProfile;
    });
    const { raw: verifyTokenRaw, hash: verifyTokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await prisma.emailVerificationToken.create({
      data: {
        profileId: profile.id,
        tokenHash: verifyTokenHash,
        expiresAt
      }
    });
    await notificationQueue.add("send-welcome-email", {
      userId: profile.id,
      email: profile.email,
      name: profile.name,
      verifyToken: verifyTokenRaw
    });
    let redirectTo = "/patient";
    if (profile.role === "doctor") {
      redirectTo = "/doctor";
    } else if (profile.role === "admin") {
      redirectTo = "/admin";
    }
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const token = import_jsonwebtoken.default.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name
      },
      secret,
      { expiresIn: "7d" }
    );
    const refreshToken = import_jsonwebtoken.default.sign({ sub: profile.id }, secret, { expiresIn: "7d" });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    return res.status(201).json({
      ok: true,
      data: {
        token,
        userId: profile.id,
        role: profile.role,
        redirectTo,
        confirmationRequired: false
      }
    });
  } catch (error) {
    next(error);
  }
}
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const profile = await prisma.profile.findUnique({
      where: { email, deletedAt: null }
    });
    if (!profile || !import_bcryptjs.default.compareSync(password, profile.passwordHash)) {
      return res.status(401).json({ ok: false, error: "Invalid email or password" });
    }
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const token = import_jsonwebtoken.default.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name
      },
      secret,
      { expiresIn: "7d" }
    );
    const refreshToken = import_jsonwebtoken.default.sign({ sub: profile.id }, secret, { expiresIn: "7d" });
    res.cookie("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1e3
      // 7 days
    });
    let redirectTo = "/patient";
    if (profile.role === "doctor") {
      redirectTo = "/doctor";
    } else if (profile.role === "admin") {
      redirectTo = "/admin";
    }
    return res.json({
      ok: true,
      data: {
        token,
        userId: profile.id,
        role: profile.role,
        redirectTo
      }
    });
  } catch (error) {
    next(error);
  }
}
async function logout(req, res, next) {
  try {
    res.clearCookie("refresh_token");
    return res.json({ ok: true, data: { message: "Successfully logged out" } });
  } catch (error) {
    next(error);
  }
}
async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    const profile = await prisma.profile.findUnique({ where: { email } });
    if (profile) {
      await prisma.passwordResetToken.updateMany({
        where: { profileId: profile.id, usedAt: null },
        data: { usedAt: /* @__PURE__ */ new Date() }
      });
      const { raw: resetTokenRaw, hash: resetTokenHash } = generateToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1e3);
      await prisma.passwordResetToken.create({
        data: {
          profileId: profile.id,
          tokenHash: resetTokenHash,
          expiresAt,
          ip: req.ip
        }
      });
      await notificationQueue.add("password_reset", {
        userId: profile.id,
        email: profile.email,
        resetToken: resetTokenRaw
      });
    }
    return res.json({
      ok: true,
      data: { message: "If that email exists, we have sent a reset password link" }
    });
  } catch (error) {
    next(error);
  }
}
async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);
    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash }
    });
    if (!resetTokenRecord || resetTokenRecord.usedAt || resetTokenRecord.expiresAt < /* @__PURE__ */ new Date()) {
      return res.status(400).json({ ok: false, error: "Invalid or expired reset token" });
    }
    const passwordHash = import_bcryptjs.default.hashSync(password, 10);
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: resetTokenRecord.profileId },
        data: { passwordHash }
      });
      await tx.passwordResetToken.update({
        where: { id: resetTokenRecord.id },
        data: { usedAt: /* @__PURE__ */ new Date() }
      });
    });
    await notificationQueue.add("password_changed_confirmation", {
      userId: resetTokenRecord.profileId
    });
    return res.json({
      ok: true,
      data: { message: "Password has been successfully updated" }
    });
  } catch (error) {
    next(error);
  }
}
async function updateProfile(req, res, next) {
  try {
    const { name, phone } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const updatedProfile = await prisma.profile.update({
      where: { id: userId },
      data: {
        name,
        phone
      }
    });
    return res.json({
      ok: true,
      data: {
        id: updatedProfile.id,
        name: updatedProfile.name,
        email: updatedProfile.email,
        phone: updatedProfile.phone,
        role: updatedProfile.role
      }
    });
  } catch (error) {
    next(error);
  }
}
async function getProfile(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        doctor: true
      }
    });
    if (!profile) {
      return res.status(404).json({ ok: false, error: "Profile not found" });
    }
    return res.json({ ok: true, data: profile });
  } catch (error) {
    next(error);
  }
}
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    if (!import_bcryptjs.default.compareSync(currentPassword, profile.passwordHash)) {
      return res.status(400).json({ ok: false, error: "Current password is incorrect" });
    }
    const newPasswordHash = import_bcryptjs.default.hashSync(newPassword, 10);
    await prisma.profile.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash }
    });
    return res.json({ ok: true, message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
}
async function googleLogin(req, res, next) {
  try {
    const { next: redirectTo } = req.body;
    if (!process.env.GOOGLE_OAUTH_CLIENT_ID) {
      return res.status(500).json({ ok: false, error: "Google OAuth is not configured on the server." });
    }
    const googleClient = getGoogleClient();
    const url = googleClient.generateAuthUrl({
      access_type: "offline",
      scope: ["https://www.googleapis.com/auth/userinfo.profile", "https://www.googleapis.com/auth/userinfo.email"],
      state: encodeURIComponent(redirectTo || "/patient"),
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
    });
    return res.status(200).json({ ok: true, data: { url } });
  } catch (error) {
    next(error);
  }
}
async function googleCallback(req, res, next) {
  try {
    const { code, state, error: authError } = req.query;
    const redirectTo = state ? decodeURIComponent(state) : "/patient";
    if (authError) {
      return res.status(400).send(`Authentication failed: ${authError}`);
    }
    if (!code) {
      return res.status(400).send("No authorization code provided.");
    }
    const googleClient = getGoogleClient();
    const { tokens } = await googleClient.getToken({
      code,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL || "http://localhost:4000/api/auth/google/callback"
    });
    googleClient.setCredentials(tokens);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(400).send("Invalid Google account data.");
    }
    const email = payload.email;
    const name = payload.name || "Google User";
    let profile = await prisma.profile.findUnique({ where: { email } });
    if (!profile) {
      profile = await prisma.$transaction(async (tx) => {
        const newProfile = await tx.profile.create({
          data: {
            email,
            passwordHash: import_bcryptjs.default.hashSync(crypto.randomUUID(), 10),
            // Random dummy password
            name,
            role: "patient",
            phone: "",
            emailVerifiedAt: /* @__PURE__ */ new Date()
            // Pre-verified via Google
          }
        });
        await tx.patient.create({
          data: { profileId: newProfile.id }
        });
        return newProfile;
      });
    }
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const token = import_jsonwebtoken.default.sign(
      {
        sub: profile.id,
        email: profile.email,
        role: profile.role,
        name: profile.name
      },
      secret,
      { expiresIn: "7d" }
    );
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3003";
    res.cookie("authToken", token, {
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1e3
    });
    return res.redirect(`${frontendUrl}${redirectTo}`);
  } catch (error) {
    next(error);
  }
}
async function verifyEmail(req, res, next) {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ ok: false, error: "Token is required" });
    const tokenHash = hashToken(token);
    const verificationRecord = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash }
    });
    if (!verificationRecord || verificationRecord.usedAt || verificationRecord.expiresAt < /* @__PURE__ */ new Date()) {
      return res.status(400).json({ ok: false, error: "Invalid or expired verification link" });
    }
    await prisma.$transaction(async (tx) => {
      await tx.profile.update({
        where: { id: verificationRecord.profileId },
        data: { emailVerifiedAt: /* @__PURE__ */ new Date() }
      });
      await tx.emailVerificationToken.update({
        where: { id: verificationRecord.id },
        data: { usedAt: /* @__PURE__ */ new Date() }
      });
    });
    return res.json({ ok: true, data: { message: "Email verified successfully" } });
  } catch (error) {
    next(error);
  }
}
async function resendVerification(req, res, next) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ ok: false, error: "Unauthorized" });
    const profile = await prisma.profile.findUnique({ where: { id: userId } });
    if (!profile) return res.status(404).json({ ok: false, error: "User not found" });
    if (profile.emailVerifiedAt) return res.status(400).json({ ok: false, error: "Email is already verified" });
    await prisma.emailVerificationToken.updateMany({
      where: { profileId: userId, usedAt: null },
      data: { usedAt: /* @__PURE__ */ new Date() }
    });
    const { raw: verifyTokenRaw, hash: verifyTokenHash } = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1e3);
    await prisma.emailVerificationToken.create({
      data: {
        profileId: userId,
        tokenHash: verifyTokenHash,
        expiresAt
      }
    });
    await notificationQueue.add("send-welcome-email", {
      userId: profile.id,
      email: profile.email,
      name: profile.name,
      verifyToken: verifyTokenRaw
    });
    return res.json({ ok: true, data: { message: "Verification email sent" } });
  } catch (error) {
    next(error);
  }
}

// src/middleware/validate.ts
var import_zod = require("zod");
var validate = (schema) => {
  return async (req, res, next) => {
    try {
      const parsedBody = await schema.parseAsync(req.body);
      req.body = parsedBody;
      next();
    } catch (error) {
      if (error instanceof import_zod.ZodError) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: error.errors
        });
      }
      return res.status(500).json({ ok: false, error: "Internal validation error" });
    }
  };
};

// src/middleware/auth.ts
var import_jsonwebtoken2 = __toESM(require("jsonwebtoken"));
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Missing authorization token" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Missing token content" });
  }
  try {
    const secret = process.env.JWT_SECRET || "fallback_default_jwt_secret_key_change_me_in_prod";
    const payload = import_jsonwebtoken2.default.verify(token, secret);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };
    next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Unauthenticated: Invalid or expired token" });
  }
}
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, error: "Unauthenticated" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden: Insufficient privileges" });
    }
    next();
  };
}

// ../../packages/types/src/index.ts
var import_zod2 = require("zod");
var userRoleSchema = import_zod2.z.enum(["patient", "doctor", "admin"]);
var appointmentStatusSchema = import_zod2.z.enum([
  "booked",
  "confirmed",
  "checked_in",
  "in_consultation",
  "completed",
  "cancelled",
  "no_show"
]);
var queueEntryStatusSchema = import_zod2.z.enum([
  "waiting",
  "in_consultation",
  "completed",
  "no_show"
]);
var notificationChannelSchema = import_zod2.z.enum(["email", "sms", "whatsapp"]);
var signupInputSchema = import_zod2.z.object({
  email: import_zod2.z.string().email(),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters"),
  name: import_zod2.z.string().min(1, "Name is required"),
  role: import_zod2.z.enum(["patient", "doctor", "admin"]).optional(),
  phone: import_zod2.z.string().optional()
});
var loginInputSchema = import_zod2.z.object({
  email: import_zod2.z.string().email(),
  password: import_zod2.z.string().min(1)
});
var googleAuthInputSchema = import_zod2.z.object({
  code: import_zod2.z.string().min(1).optional(),
  next: import_zod2.z.string().startsWith("/").optional()
}).optional().default({});
var forgotPasswordInputSchema = import_zod2.z.object({
  email: import_zod2.z.string().email()
});
var resetPasswordInputSchema = import_zod2.z.object({
  token: import_zod2.z.string().min(1, "Reset token is required"),
  password: import_zod2.z.string().min(8, "Password must be at least 8 characters")
});
var logoutInputSchema = import_zod2.z.object({
  allDevices: import_zod2.z.boolean().optional().default(false)
});
var createAppointmentInputSchema = import_zod2.z.object({
  doctorId: import_zod2.z.string().uuid(),
  slotTime: import_zod2.z.string().datetime()
});
var rescheduleAppointmentInputSchema = import_zod2.z.object({
  newSlotTime: import_zod2.z.string().datetime()
});
var consultationNotesInputSchema = import_zod2.z.object({
  diagnosis: import_zod2.z.string().optional(),
  notes: import_zod2.z.string().optional()
});
var createDoctorInputSchema = import_zod2.z.object({
  name: import_zod2.z.string().min(1),
  email: import_zod2.z.string().email(),
  phone: import_zod2.z.string().nullable().optional(),
  clinicId: import_zod2.z.string().uuid(),
  specialty: import_zod2.z.string().nullable().optional(),
  slotDurationMin: import_zod2.z.number().int().min(5).max(120).default(15),
  maxPatientsPerSlot: import_zod2.z.number().int().min(1).max(10).default(1)
});
var doctorAvailabilityInputSchema = import_zod2.z.object({
  weekday: import_zod2.z.number().int().min(0).max(6),
  startTime: import_zod2.z.string().regex(/^\d{2}:\d{2}$/),
  endTime: import_zod2.z.string().regex(/^\d{2}:\d{2}$/)
});
var clinicHolidayInputSchema = import_zod2.z.object({
  date: import_zod2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: import_zod2.z.string().optional()
});
var doctorLeaveInputSchema = import_zod2.z.object({
  date: import_zod2.z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: import_zod2.z.string().optional()
});
var publicQueueSnapshotSchema = import_zod2.z.object({
  doctors: import_zod2.z.array(import_zod2.z.object({
    doctor_id: import_zod2.z.string(),
    doctor_name: import_zod2.z.string(),
    current_token: import_zod2.z.number().int().nonnegative(),
    waiting_count: import_zod2.z.number().int().nonnegative()
  }))
});
var domainEventTypes = [
  "USER_REGISTERED",
  "EMAIL_VERIFIED",
  "PASSWORD_RESET_REQUESTED",
  "PASSWORD_RESET_COMPLETED",
  "GOOGLE_LOGIN_COMPLETED",
  "APPOINTMENT_CREATED",
  "APPOINTMENT_CANCELLED",
  "APPOINTMENT_RESCHEDULED",
  "PATIENT_CHECKED_IN",
  "DOCTOR_STARTED_CONSULTATION",
  "PATIENT_COMPLETED",
  "QUEUE_ADVANCED",
  "NO_SHOW_MARKED",
  "ADMIN_USER_UPDATED",
  "ADMIN_USER_DELETED",
  "ROLE_CHANGED",
  "QUEUE_OVERRIDE_USED",
  "DAY_CLOSED"
];
var domainEventTypeSchema = import_zod2.z.enum(domainEventTypes);
var domainEventSchema = import_zod2.z.object({
  id: import_zod2.z.string().uuid(),
  type: domainEventTypeSchema,
  occurredAt: import_zod2.z.string().datetime(),
  payload: import_zod2.z.record(import_zod2.z.unknown())
});
var apiErrorSchema = import_zod2.z.object({
  ok: import_zod2.z.literal(false),
  error: import_zod2.z.string(),
  details: import_zod2.z.unknown().optional()
});
var signupResponseSchema = import_zod2.z.object({
  ok: import_zod2.z.literal(true),
  data: import_zod2.z.object({
    userId: import_zod2.z.string().uuid().optional(),
    confirmationRequired: import_zod2.z.boolean()
  })
});
var loginResponseSchema = import_zod2.z.object({
  ok: import_zod2.z.literal(true),
  data: import_zod2.z.object({
    userId: import_zod2.z.string().uuid(),
    role: userRoleSchema,
    redirectTo: import_zod2.z.string().startsWith("/")
  })
});
var googleAuthResponseSchema = import_zod2.z.object({
  ok: import_zod2.z.literal(true),
  data: import_zod2.z.union([
    import_zod2.z.object({ url: import_zod2.z.string().url() }),
    import_zod2.z.object({
      userId: import_zod2.z.string().uuid(),
      role: userRoleSchema,
      redirectTo: import_zod2.z.string().startsWith("/")
    })
  ])
});
var messageResponseSchema = import_zod2.z.object({
  ok: import_zod2.z.literal(true),
  data: import_zod2.z.object({
    message: import_zod2.z.string()
  })
});

// src/modules/auth/auth.router.ts
var router = (0, import_express.Router)();
router.post("/signup", validate(signupInputSchema), signup);
router.post("/login", validate(loginInputSchema), login);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordInputSchema), forgotPassword);
router.post("/reset-password", validate(resetPasswordInputSchema), resetPassword);
router.get("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, resendVerification);
router.post("/google", googleLogin);
router.get("/google/callback", googleCallback);
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

// src/modules/patient/patient.router.ts
var import_express2 = require("express");

// src/modules/patient/patient.controller.ts
async function updatePatientProfile(req, res, next) {
  try {
    const patient = await prisma.patient.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true }
    });
    if (!patient) {
      return res.status(404).json({ ok: false, error: "Patient profile not found" });
    }
    const { name, phone, avatarUrl, gender, bloodGroup, allergies, emergencyContactName, emergencyContactPhone } = req.body;
    const profileUpdate = {};
    if (name !== void 0) profileUpdate.name = name;
    if (phone !== void 0) profileUpdate.phone = phone;
    if (avatarUrl !== void 0) profileUpdate.avatarUrl = avatarUrl;
    if (Object.keys(profileUpdate).length > 0) {
      await prisma.profile.update({
        where: { id: patient.profileId },
        data: profileUpdate
      });
    }
    const patientUpdate = {};
    if (gender !== void 0) patientUpdate.gender = gender;
    if (bloodGroup !== void 0) patientUpdate.bloodGroup = bloodGroup;
    if (allergies !== void 0) patientUpdate.allergies = allergies;
    if (emergencyContactName !== void 0) patientUpdate.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== void 0) patientUpdate.emergencyContactPhone = emergencyContactPhone;
    let updatedPatient = patient;
    if (Object.keys(patientUpdate).length > 0) {
      updatedPatient = await prisma.patient.update({
        where: { id: patient.id },
        data: patientUpdate,
        include: { profile: true }
      });
    } else {
      updatedPatient = await prisma.patient.findUnique({
        where: { id: patient.id },
        include: { profile: true }
      });
    }
    return res.json({ ok: true, data: updatedPatient });
  } catch (error) {
    next(error);
  }
}

// src/modules/patient/patient.router.ts
var router2 = (0, import_express2.Router)();
router2.use(requireAuth);
router2.use(requireRole(["patient"]));
router2.patch("/profile", updatePatientProfile);

// src/modules/queue/queue.router.ts
var import_express3 = require("express");

// src/modules/queue/queue.controller.ts
init_src3();
init_socket();
init_queue();

// src/modules/admin/admin.controller.ts
var import_bcryptjs2 = __toESM(require("bcryptjs"));
init_src3();
async function getPatients(req, res, next) {
  try {
    const search = req.query.search;
    const limit = parseInt(req.query.limit || "50", 10);
    const offset = parseInt(req.query.offset || "0", 10);
    const whereClause = {
      role: "patient",
      deletedAt: null
    };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ];
    }
    const [patients, total] = await prisma.$transaction([
      prisma.patient.findMany({
        where: {
          profile: whereClause
        },
        include: {
          profile: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              createdAt: true
            }
          }
        },
        orderBy: { id: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.patient.count({
        where: {
          profile: whereClause
        }
      })
    ]);
    return res.json({
      ok: true,
      data: patients,
      pagination: { limit, offset, total }
    });
  } catch (error) {
    next(error);
  }
}
async function getClinics(req, res, next) {
  try {
    const clinics = await prisma.clinic.findMany();
    return res.json({ ok: true, data: clinics });
  } catch (error) {
    next(error);
  }
}
async function updateClinic(req, res, next) {
  try {
    const { id } = req.params;
    const { name, openTime, closeTime, gettingCloseThreshold } = req.body;
    const clinic = await prisma.clinic.update({
      where: { id },
      data: {
        ...name !== void 0 && { name },
        ...openTime !== void 0 && { openTime },
        ...closeTime !== void 0 && { closeTime },
        ...gettingCloseThreshold !== void 0 && { gettingCloseThreshold }
      }
    });
    return res.json({ ok: true, data: clinic });
  } catch (error) {
    next(error);
  }
}
async function getDoctors(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const offset = parseInt(req.query.offset || "0", 10);
    const [doctors, total] = await prisma.$transaction([
      prisma.doctor.findMany({
        include: {
          profile: {
            select: { id: true, email: true, name: true, phone: true }
          },
          clinic: true
        },
        orderBy: { id: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.doctor.count()
    ]);
    return res.json({
      ok: true,
      data: doctors,
      pagination: { limit, offset, total }
    });
  } catch (error) {
    next(error);
  }
}
async function getAppointmentsAdmin(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || "50", 10);
    const offset = parseInt(req.query.offset || "0", 10);
    const [appointments, total] = await prisma.$transaction([
      prisma.appointment.findMany({
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true, email: true }
              }
            }
          },
          doctor: {
            include: {
              profile: {
                select: { name: true }
              }
            }
          },
          clinic: true
        },
        orderBy: { slotTime: "desc" },
        take: limit,
        skip: offset
      }),
      prisma.appointment.count()
    ]);
    return res.json({
      ok: true,
      data: appointments,
      pagination: { limit, offset, total }
    });
  } catch (error) {
    next(error);
  }
}
async function getAnalytics(req, res, next) {
  try {
    const today = getClinicDayRange();
    const sevenDaysAgo = /* @__PURE__ */ new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const totalAppointments = await prisma.appointment.count();
    const appointmentsToday = await prisma.appointment.count({
      where: { slotTime: { gte: today.start, lte: today.end } }
    });
    const doctorsOnline = await prisma.doctor.count({
      where: { isOnline: true }
    });
    const completedCount = await prisma.appointment.count({ where: { status: "completed" } });
    const cancelledCount = await prisma.appointment.count({ where: { status: "cancelled" } });
    const noShowCount = await prisma.appointment.count({ where: { status: "no_show" } });
    const total7Days = await prisma.appointment.count({
      where: { slotTime: { gte: sevenDaysAgo } }
    });
    const noShow7Days = await prisma.appointment.count({
      where: { status: "no_show", slotTime: { gte: sevenDaysAgo } }
    });
    const noShowRate7Days = total7Days > 0 ? noShow7Days / total7Days * 100 : 0;
    const cancellationRate = totalAppointments > 0 ? cancelledCount / totalAppointments * 100 : 0;
    const noShowRate = totalAppointments > 0 ? noShowCount / totalAppointments * 100 : 0;
    const completionRate = totalAppointments > 0 ? completedCount / totalAppointments * 100 : 0;
    const waitingCount = await prisma.queueEntry.count({
      where: { status: "waiting" }
    });
    const avgWaitTimeToday = waitingCount > 0 ? waitingCount * 12 : 11;
    const doctorsList = await prisma.doctor.findMany({
      where: { deletedAt: null },
      include: {
        profile: {
          select: { name: true, email: true }
        }
      }
    });
    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        profile: {
          select: { name: true }
        }
      }
    });
    return res.json({
      ok: true,
      data: {
        totalAppointments,
        appointmentsToday,
        doctorsOnline,
        completedCount,
        cancelledCount,
        noShowCount,
        noShowRate7Days: parseFloat(noShowRate7Days.toFixed(2)),
        cancellationRate: parseFloat(cancellationRate.toFixed(2)),
        noShowRate: parseFloat(noShowRate.toFixed(2)),
        completionRate: parseFloat(completionRate.toFixed(2)),
        avgWaitTimeToday,
        doctorsList,
        recentAuditLogs
      }
    });
  } catch (error) {
    next(error);
  }
}
async function getLiveAnalytics(req, res, next) {
  try {
    const { clinicId } = req.query;
    if (!clinicId) return res.status(400).json({ ok: false, error: "Missing clinicId" });
    const stats = await computeLiveAdminStats(clinicId);
    return res.json({ ok: true, data: stats });
  } catch (error) {
    next(error);
  }
}
async function getAuditLogs(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || "25", 10);
    const cursor = req.query.cursor;
    const { actorId, action, resourceType, dateFrom, dateTo, search, sortBy = "createdAt", sortDir = "desc" } = req.query;
    const where = {};
    if (actorId) where.actorId = actorId;
    if (action) {
      where.action = { in: action.split(",") };
    }
    if (resourceType) {
      where.resourceType = { in: resourceType.split(",") };
    }
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { resourceType: { contains: search } },
        { profile: { name: { contains: search } } }
      ];
    }
    const query = {
      where,
      take: limit + 1,
      // Fetch one extra to see if there is a next page
      orderBy: { [sortBy]: sortDir === "asc" ? "asc" : "desc" },
      include: {
        profile: { select: { name: true, role: true } }
      }
    };
    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }
    const logs = await prisma.auditLog.findMany(query);
    let nextCursor = null;
    let hasMore = false;
    if (logs.length > limit) {
      hasMore = true;
      const nextItem = logs.pop();
      if (nextItem) nextCursor = nextItem.id;
    }
    return res.json({
      ok: true,
      data: logs,
      pagination: { nextCursor, hasMore }
    });
  } catch (error) {
    next(error);
  }
}
async function exportAuditLogs(req, res, next) {
  try {
    const { actorId, action, resourceType, dateFrom, dateTo, search } = req.query;
    const where = {};
    if (actorId) where.actorId = actorId;
    if (action) where.action = { in: action.split(",") };
    if (resourceType) where.resourceType = { in: resourceType.split(",") };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      where.OR = [
        { action: { contains: search } },
        { resourceType: { contains: search } },
        { profile: { name: { contains: search } } }
      ];
    }
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { profile: { select: { name: true, role: true } } }
    });
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=audit-logs.csv");
    const headers = ["Timestamp", "Actor", "Role", "Action", "Resource Type", "Resource ID", "Metadata"];
    const rows = logs.map((l) => [
      l.createdAt.toISOString(),
      `"${l.profile?.name || "System"}"`,
      l.profile?.role || "system",
      l.action,
      l.resourceType,
      l.resourceId || "",
      `"${l.metadata.replace(/"/g, '""')}"`
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    return res.send(csv);
  } catch (error) {
    next(error);
  }
}
async function computeLiveAdminStats(clinicId) {
  const today = getClinicDayRange();
  const todayStart = today.start;
  const appointmentsToday = await prisma.appointment.count({
    where: {
      clinicId,
      slotTime: { gte: today.start, lte: today.end }
    }
  });
  const patientsWaitingNow = await prisma.queueEntry.count({
    where: {
      status: "waiting",
      appointment: { clinicId }
    }
  });
  const doctorsOnline = await prisma.doctor.count({
    where: {
      clinicId,
      isOnline: true
    }
  });
  const noShowsToday = await prisma.appointment.count({
    where: {
      clinicId,
      status: "no_show",
      updatedAt: { gte: todayStart }
    }
  });
  const completedAppointments = await prisma.appointment.findMany({
    where: {
      clinicId,
      status: "completed",
      updatedAt: { gte: todayStart }
    },
    select: {
      updatedAt: true,
      queueEntry: { select: { checkedInAt: true } }
    }
  });
  let totalWaitMs = 0;
  let count = 0;
  for (const appointment of completedAppointments) {
    const checkedInAt = appointment.queueEntry?.checkedInAt;
    if (checkedInAt) {
      totalWaitMs += appointment.updatedAt.getTime() - checkedInAt.getTime();
      count++;
    }
  }
  const avgWaitTimeMinutes = count > 0 ? Math.round(totalWaitMs / count / 6e4) : 0;
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: { profile: { select: { name: true } } }
  });
  const doctorPerformance = await Promise.all(doctors.map(async (doc) => {
    const patientsSeenToday = await prisma.appointment.count({
      where: { doctorId: doc.id, status: "completed", updatedAt: { gte: todayStart } }
    });
    const docNoShowsToday = await prisma.appointment.count({
      where: { doctorId: doc.id, status: "no_show", updatedAt: { gte: todayStart } }
    });
    const docCompletedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId: doc.id,
        status: "completed",
        updatedAt: { gte: todayStart }
      },
      select: {
        updatedAt: true,
        queueEntry: { select: { checkedInAt: true } }
      }
    });
    let dTotal = 0;
    let dCount = 0;
    for (const appointment of docCompletedAppointments) {
      const checkedInAt = appointment.queueEntry?.checkedInAt;
      if (checkedInAt) {
        dTotal += appointment.updatedAt.getTime() - checkedInAt.getTime();
        dCount++;
      }
    }
    const avgConsultationMinutes = dCount > 0 ? Math.round(dTotal / dCount / 6e4) : 0;
    return {
      doctorId: doc.id,
      doctorName: doc.profile.name,
      patientsSeenToday,
      noShowsToday: docNoShowsToday,
      avgConsultationMinutes
    };
  }));
  return {
    appointmentsToday,
    patientsWaitingNow,
    doctorsOnline,
    noShowsToday,
    avgWaitTimeMinutes,
    doctorPerformance
  };
}
async function createDoctor(req, res, next) {
  try {
    const { name, email, phone, clinicId, specialty, slotDurationMin, maxPatientsPerSlot } = req.body;
    const existing = await prisma.profile.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ ok: false, error: "Email is already registered" });
    }
    const defaultPassword = "DoctorTempPassword123!";
    const passwordHash = import_bcryptjs2.default.hashSync(defaultPassword, 10);
    const doctor = await prisma.$transaction(async (tx) => {
      const profile = await tx.profile.create({
        data: {
          email,
          passwordHash,
          name,
          phone: phone || null,
          role: "doctor"
        }
      });
      return await tx.doctor.create({
        data: {
          profileId: profile.id,
          clinicId,
          specialty: specialty || null,
          slotDurationMin: slotDurationMin || 15,
          maxPatientsPerSlot: maxPatientsPerSlot || 1
        }
      });
    });
    return res.status(201).json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
}
async function updateAvailability(req, res, next) {
  try {
    const id = req.params.id;
    const { weekday, startTime, endTime } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }
    const availability = await prisma.doctorAvailability.upsert({
      where: {
        doctorId_weekday_startTime: {
          doctorId: id,
          weekday,
          startTime
        }
      },
      update: { endTime },
      create: {
        doctorId: id,
        weekday,
        startTime,
        endTime
      }
    });
    return res.json({ ok: true, data: availability });
  } catch (error) {
    next(error);
  }
}
async function addHoliday(req, res, next) {
  try {
    const id = req.params.id;
    const { date, reason: reason5 } = req.body;
    const clinic = await prisma.clinic.findUnique({ where: { id } });
    if (!clinic) {
      return res.status(404).json({ ok: false, error: "Clinic not found" });
    }
    const holiday = await prisma.clinicHoliday.create({
      data: {
        clinicId: id,
        date: new Date(date),
        reason: reason5 || null
      }
    });
    return res.status(201).json({ ok: true, data: holiday });
  } catch (error) {
    next(error);
  }
}
async function addLeave(req, res, next) {
  try {
    const id = req.params.id;
    const { date, reason: reason5 } = req.body;
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }
    const leave = await prisma.doctorLeave.create({
      data: {
        doctorId: id,
        date: new Date(date),
        reason: reason5 || null
      }
    });
    return res.status(201).json({ ok: true, data: leave });
  } catch (error) {
    next(error);
  }
}
async function adminAddQueueEntry(req, res, next) {
  try {
    const { patientId, doctorId, clinicId, slotTime } = req.body;
    const patient = await prisma.patient.findUnique({ where: { id: patientId } });
    if (!patient) return res.status(400).json({ ok: false, error: "Patient not found" });
    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return res.status(400).json({ ok: false, error: "Doctor not found" });
    const slotDate = slotTime ? new Date(slotTime) : /* @__PURE__ */ new Date();
    const slotDay = getClinicDayRange(slotDate);
    const tokenCount = await prisma.appointment.count({
      where: {
        doctorId,
        slotTime: {
          gte: slotDay.start,
          lte: slotDay.end
        },
        status: { notIn: ["cancelled", "no_show"] }
      }
    });
    const tokenNo = tokenCount + 1;
    const result = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          patientId,
          doctorId,
          clinicId: doctor.clinicId,
          slotTime: slotDate,
          tokenNo,
          status: "checked_in"
          // Checked in because admin checked them in physically
        }
      });
      let session = await tx.queueSession.findUnique({
        where: {
          doctorId_sessionDate: {
            doctorId,
            sessionDate: slotDay.sessionDate
          }
        }
      });
      if (!session) {
        session = await tx.queueSession.create({
          data: {
            doctorId,
            sessionDate: slotDay.sessionDate,
            status: doctor.isOnline ? "active" : "not_started",
            currentToken: 0
          }
        });
      }
      const positionCount = await tx.queueEntry.count({
        where: { sessionId: session.id }
      });
      const entry = await tx.queueEntry.create({
        data: {
          sessionId: session.id,
          appointmentId: appt.id,
          position: positionCount + 1,
          status: "waiting",
          joinedAt: /* @__PURE__ */ new Date(),
          checkedInAt: /* @__PURE__ */ new Date()
        }
      });
      await tx.queueEvent.create({
        data: {
          sessionId: session.id,
          type: "APPOINTMENT_CREATED",
          payload: JSON.stringify({ appointmentId: appt.id })
        }
      });
      await tx.queueEvent.create({
        data: {
          sessionId: session.id,
          type: "QUEUE_JOINED",
          payload: JSON.stringify({ appointmentId: appt.id })
        }
      });
      return { appt, entry };
    });
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(doctor.clinicId);
    broadcastQueueUpdate2(doctor.clinicId, snapshot);
    return res.status(201).json({ ok: true, data: result });
  } catch (error) {
    next(error);
  }
}
async function adminEditQueueEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    const { status, position, doctorId } = req.body;
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { appointment: true, session: true }
    });
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Queue entry not found" });
    }
    const clinicId = entry.appointment.clinicId;
    await prisma.$transaction(async (tx) => {
      if (status) {
        await tx.queueEntry.update({
          where: { id: entryId },
          data: { status }
        });
        let apptStatus = "booked";
        if (status === "in_consultation") apptStatus = "in_consultation";
        if (status === "completed") apptStatus = "completed";
        if (status === "no_show") apptStatus = "no_show";
        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: { status: apptStatus }
        });
      }
      if (doctorId && doctorId !== entry.session.doctorId) {
        const newDoctor = await tx.doctor.findUnique({ where: { id: doctorId } });
        if (!newDoctor) throw new Error("Target doctor not found");
        const sessionDate = entry.session.sessionDate;
        let newSession = await tx.queueSession.findUnique({
          where: {
            doctorId_sessionDate: {
              doctorId,
              sessionDate
            }
          }
        });
        if (!newSession) {
          newSession = await tx.queueSession.create({
            data: {
              doctorId,
              sessionDate,
              status: newDoctor.isOnline ? "active" : "not_started",
              currentToken: 0
            }
          });
        }
        const newSessionEntriesCount = await tx.queueEntry.count({
          where: { sessionId: newSession.id }
        });
        await tx.appointment.update({
          where: { id: entry.appointmentId },
          data: { doctorId }
        });
        await tx.queueEntry.update({
          where: { id: entryId },
          data: {
            sessionId: newSession.id,
            position: newSessionEntriesCount + 1
          }
        });
        const oldSessionEntries = await tx.queueEntry.findMany({
          where: { sessionId: entry.sessionId, id: { not: entryId } },
          orderBy: { position: "asc" }
        });
        let pos = 1;
        for (const oldEntry of oldSessionEntries) {
          await tx.queueEntry.update({
            where: { id: oldEntry.id },
            data: { position: pos }
          });
          pos++;
        }
      }
      if (position !== void 0 && position !== entry.position) {
        const sessionEntries = await tx.queueEntry.findMany({
          where: { sessionId: entry.sessionId },
          orderBy: { position: "asc" }
        });
        const otherEntries = sessionEntries.filter((e) => e.id !== entryId);
        const targetIndex = Math.max(0, Math.min(position - 1, otherEntries.length));
        otherEntries.splice(targetIndex, 0, entry);
        let pos = 1;
        for (const orderedEntry of otherEntries) {
          await tx.queueEntry.update({
            where: { id: orderedEntry.id },
            data: { position: pos }
          });
          pos++;
        }
      }
    });
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(clinicId);
    broadcastQueueUpdate2(clinicId, snapshot);
    return res.json({ ok: true, message: "Queue entry updated successfully" });
  } catch (error) {
    next(error);
  }
}
async function adminDeleteQueueEntry(req, res, next) {
  try {
    const { entryId } = req.params;
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { appointment: true }
    });
    if (!entry) {
      return res.status(404).json({ ok: false, error: "Queue entry not found" });
    }
    const clinicId = entry.appointment.clinicId;
    await prisma.$transaction(async (tx) => {
      await tx.appointment.update({
        where: { id: entry.appointmentId },
        data: { status: "cancelled" }
      });
      await tx.queueEntry.delete({
        where: { id: entryId }
      });
      const sessionEntries = await tx.queueEntry.findMany({
        where: { sessionId: entry.sessionId },
        orderBy: { position: "asc" }
      });
      let pos = 1;
      for (const orderedEntry of sessionEntries) {
        await tx.queueEntry.update({
          where: { id: orderedEntry.id },
          data: { position: pos }
        });
        pos++;
      }
    });
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(clinicId);
    broadcastQueueUpdate2(clinicId, snapshot);
    return res.json({ ok: true, message: "Queue entry deleted and appointment cancelled successfully" });
  } catch (error) {
    next(error);
  }
}

// src/modules/queue/queue.controller.ts
async function getQueueStatus(req, res, next) {
  try {
    const { clinicId } = req.params;
    if (!clinicId) {
      return res.status(400).json({ ok: false, error: "Missing clinicId parameter" });
    }
    const snapshot = await getLiveQueueSnapshot(clinicId);
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function startConsult(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }
    await startConsultation({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    const snapshot = await getLiveQueueSnapshot(appointment.clinicId);
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(appointment.clinicId);
    broadcastAdminStatsUpdate(appointment.clinicId, adminStats);
    await notificationQueue.add("being_called", {
      appointmentId: appointment.id
    });
    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function completeConsult(req, res, next) {
  try {
    const { id } = req.params;
    const { diagnosis, notes } = req.body;
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }
    if (diagnosis || notes) {
      await prisma.consultationNotes.upsert({
        where: { appointmentId: appointment.id },
        update: { diagnosis, notes },
        create: {
          appointmentId: appointment.id,
          doctorId: doctor.id,
          diagnosis,
          notes
        }
      });
    }
    const snapshot = await markPatientDone({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(appointment.clinicId);
    broadcastAdminStatsUpdate(appointment.clinicId, adminStats);
    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    if (notes || diagnosis) {
      await aiQueue.add("process-consultation-ai", {
        appointmentId: appointment.id,
        diagnosis,
        notes
      });
    }
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function markConsultNoShow(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }
    const snapshot = await markNoShow({
      appointmentId: appointment.id,
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(appointment.clinicId);
    broadcastAdminStatsUpdate(appointment.clinicId, adminStats);
    await queueQueue.add("recalc-and-notify", {
      doctorId: appointment.doctorId,
      clinicId: appointment.clinicId
    });
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function startSession(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Only doctors can start a queue session" });
    }
    const snapshot = await startQueueSession(doctor.id, doctor.clinicId);
    broadcastQueueUpdate(doctor.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(doctor.clinicId);
    broadcastAdminStatsUpdate(doctor.clinicId, adminStats);
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function patientJoinQueue(req, res, next) {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) {
      return res.status(400).json({ ok: false, error: "Missing appointmentId" });
    }
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { patient: true }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    if (appointment.patient.profileId !== req.user?.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another patient" });
    }
    const snapshot = await joinQueue(appointment.id, appointment.doctorId, appointment.clinicId);
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(appointment.clinicId);
    broadcastAdminStatsUpdate(appointment.clinicId, adminStats);
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function skipConsult(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }
    const { skipPatient: skipPatient2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const snapshot = await skipPatient2(appointment.id, doctor.id, appointment.clinicId);
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const adminStats = await computeLiveAdminStats(appointment.clinicId);
    broadcastAdminStatsUpdate(appointment.clinicId, adminStats);
    await queueQueue.add("recalc-and-notify", {
      doctorId: doctor.id,
      clinicId: appointment.clinicId
    });
    const { notificationQueue: notificationQueue2 } = await Promise.resolve().then(() => (init_queue(), queue_exports));
    const patientProfile = await prisma.patient.findUnique({
      where: { id: appointment.patientId },
      include: { profile: true }
    });
    if (patientProfile?.profile?.email) {
      await notificationQueue2.add("send-booking-reschedule", {
        appointmentId: appointment.id,
        patientId: appointment.patientId,
        email: patientProfile.profile.email,
        reason: "You've been moved to the end of the queue since you were not ready."
      });
    }
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}
async function removeQueueEntry(req, res, next) {
  try {
    const { id } = req.params;
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor || appointment.doctorId !== doctor.id) {
      return res.status(403).json({ ok: false, error: "Unauthorized: Appointment belongs to another doctor" });
    }
    const { markNoShow: markNoShow2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const snapshot = await markNoShow2({
      appointmentId: appointment.id,
      doctorId: doctor.id,
      clinicId: appointment.clinicId
    });
    broadcastQueueUpdate(appointment.clinicId, snapshot);
    const { queueQueue: qQueue } = await Promise.resolve().then(() => (init_queue(), queue_exports));
    await qQueue.add("recalc-and-notify", {
      doctorId: doctor.id,
      clinicId: appointment.clinicId
    });
    return res.json({ ok: true, data: snapshot });
  } catch (error) {
    next(error);
  }
}

// src/middleware/audit.ts
function auditLog(action, resourceType) {
  return async (req, res, next) => {
    const originalSend = res.send;
    res.send = function(body) {
      res.send = originalSend;
      let parsedBody = null;
      try {
        parsedBody = typeof body === "string" ? JSON.parse(body) : body;
      } catch (err) {
        parsedBody = body;
      }
      if (res.statusCode >= 200 && res.statusCode < 300 && (!parsedBody || parsedBody.ok !== false)) {
        prisma.auditLog.create({
          data: {
            actorId: req.user?.id || null,
            actorRole: req.user?.role || null,
            action,
            resourceType,
            resourceId: req.params.id || parsedBody?.data?.id || null,
            ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || null,
            metadata: JSON.stringify({
              body: req.body,
              query: req.query
            })
          }
        }).catch((err) => {
          console.error("Failed to write audit log:", err);
        });
      }
      return originalSend.call(this, body);
    };
    next();
  };
}

// src/modules/queue/queue.router.ts
var router3 = (0, import_express3.Router)();
router3.get("/:clinicId/current", getQueueStatus);
router3.post("/start-session", requireAuth, startSession);
router3.post("/join", requireAuth, patientJoinQueue);
router3.post(
  "/:id/start",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("START_CONSULTATION", "Appointment"),
  startConsult
);
router3.post(
  "/:id/complete",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("COMPLETE_CONSULTATION", "Appointment"),
  completeConsult
);
router3.post(
  "/:id/no-show",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("NO_SHOW_MARKED", "Appointment"),
  markConsultNoShow
);
router3.post(
  "/:id/skip",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("PATIENT_SKIPPED", "Appointment"),
  skipConsult
);
router3.post(
  "/:id/remove",
  requireAuth,
  requireRole(["doctor"]),
  auditLog("PATIENT_REMOVED_FROM_QUEUE", "Appointment"),
  removeQueueEntry
);

// src/modules/appointments/appointments.router.ts
var import_express4 = require("express");

// src/modules/appointments/appointments.controller.ts
init_queue();
init_src3();
async function getAvailableDoctors(req, res, next) {
  try {
    const doctors = await prisma.doctor.findMany({
      include: {
        profile: { select: { id: true, name: true, email: true } },
        clinic: { select: { id: true, name: true } }
      }
    });
    return res.json({ ok: true, data: doctors });
  } catch (error) {
    next(error);
  }
}
async function getAppointments(req, res, next) {
  try {
    const role = req.user?.role;
    const userId = req.user?.id;
    if (role === "patient") {
      const patient = await prisma.patient.findUnique({
        where: { profileId: userId }
      });
      if (!patient) {
        return res.status(400).json({ ok: false, error: "Patient profile not found" });
      }
      const appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: {
              profile: {
                select: { name: true }
              }
            }
          },
          clinic: true,
          queueEntry: true
        },
        orderBy: { slotTime: "desc" }
      });
      return res.json({ ok: true, data: appointments });
    }
    if (role === "doctor") {
      const doctor = await prisma.doctor.findUnique({
        where: { profileId: userId }
      });
      if (!doctor) {
        return res.status(400).json({ ok: false, error: "Doctor profile not found" });
      }
      const appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true, phone: true, email: true }
              }
            }
          },
          notes: true
        },
        orderBy: { slotTime: "asc" }
      });
      return res.json({ ok: true, data: appointments });
    }
    if (role === "admin") {
      const appointments = await prisma.appointment.findMany({
        include: {
          patient: {
            include: {
              profile: {
                select: { name: true }
              }
            }
          },
          doctor: {
            include: {
              profile: {
                select: { name: true }
              }
            }
          },
          clinic: true
        },
        orderBy: { slotTime: "desc" }
      });
      return res.json({ ok: true, data: appointments });
    }
    return res.status(403).json({ ok: false, error: "Forbidden" });
  } catch (error) {
    next(error);
  }
}
async function bookAppointment(req, res, next) {
  try {
    const userId = req.user?.id;
    const { doctorId, slotTime } = req.body;
    const patient = await prisma.patient.findUnique({
      where: { profileId: userId }
    });
    if (!patient) {
      return res.status(400).json({ ok: false, error: "Only patients can book appointments" });
    }
    const doctor = await prisma.doctor.findUnique({
      where: { id: doctorId }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor not found" });
    }
    const slotDate = new Date(slotTime);
    const conflict = await prisma.appointment.findFirst({
      where: {
        doctorId,
        slotTime: slotDate,
        status: { notIn: ["cancelled", "no_show"] }
      }
    });
    if (conflict) {
      return res.status(400).json({ ok: false, error: "This slot is already booked" });
    }
    const slotDay = getClinicDayRange(slotDate);
    const tokenCount = await prisma.appointment.count({
      where: {
        doctorId,
        slotTime: {
          gte: slotDay.start,
          lte: slotDay.end
        },
        status: { notIn: ["cancelled", "no_show"] }
      }
    });
    const tokenNo = tokenCount + 1;
    const appointment = await prisma.$transaction(async (tx) => {
      const appt = await tx.appointment.create({
        data: {
          patientId: patient.id,
          doctorId,
          clinicId: doctor.clinicId,
          slotTime: slotDate,
          tokenNo,
          status: "booked"
        }
      });
      if (isSameClinicDay(slotDate)) {
        let session = await tx.queueSession.findUnique({
          where: {
            doctorId_sessionDate: {
              doctorId,
              sessionDate: slotDay.sessionDate
            }
          }
        });
        if (!session) {
          session = await tx.queueSession.create({
            data: {
              doctorId,
              sessionDate: slotDay.sessionDate,
              status: doctor.isOnline ? "active" : "not_started",
              currentToken: 0
            }
          });
        }
        const positionCount = await tx.queueEntry.count({
          where: { sessionId: session.id }
        });
        await tx.queueEntry.create({
          data: {
            sessionId: session.id,
            appointmentId: appt.id,
            position: positionCount + 1,
            status: "waiting",
            joinedAt: /* @__PURE__ */ new Date()
          }
        });
        await tx.queueEvent.create({
          data: {
            sessionId: session.id,
            type: "APPOINTMENT_CREATED",
            payload: JSON.stringify({ appointmentId: appt.id })
          }
        });
        await tx.queueEvent.create({
          data: {
            sessionId: session.id,
            type: "QUEUE_JOINED",
            payload: JSON.stringify({ appointmentId: appt.id })
          }
        });
      }
      return appt;
    });
    if (isSameClinicDay(slotDate)) {
      const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
      const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
      const snapshot = await getLiveQueueSnapshot2(doctor.clinicId);
      broadcastQueueUpdate2(doctor.clinicId, snapshot);
    }
    await notificationQueue.add("appointment_created", {
      appointmentId: appointment.id,
      patientId: patient.id,
      email: req.user?.email,
      tokenNo
    });
    return res.status(201).json({ ok: true, data: appointment });
  } catch (error) {
    next(error);
  }
}
async function reschedule(req, res, next) {
  try {
    const { id } = req.params;
    const { newSlotTime } = req.body;
    const userId = req.user?.id;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    if (req.user?.role === "patient" && appointment.patient.profileId !== userId) {
      return res.status(403).json({ ok: false, error: "Forbidden: You do not own this appointment" });
    }
    const slotDate = new Date(newSlotTime);
    const conflict = await prisma.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId: appointment.doctorId,
        slotTime: slotDate,
        status: { notIn: ["cancelled", "no_show"] }
      }
    });
    if (conflict) {
      return res.status(400).json({ ok: false, error: "The new slot is already booked" });
    }
    const updated = await prisma.appointment.update({
      where: { id },
      data: { slotTime: slotDate, status: "confirmed" }
    });
    await notificationQueue.add("send-booking-reschedule", {
      appointmentId: updated.id,
      patientId: updated.patientId,
      newSlotTime
    });
    return res.json({ ok: true, data: updated });
  } catch (error) {
    next(error);
  }
}
async function cancel(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { patient: true }
    });
    if (!appointment) {
      return res.status(404).json({ ok: false, error: "Appointment not found" });
    }
    if (req.user?.role === "patient" && appointment.patient.profileId !== userId) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    const updated = await prisma.appointment.update({
      where: { id },
      data: { status: "cancelled" }
    });
    await notificationQueue.add("send-booking-cancellation", {
      appointmentId: updated.id,
      patientId: updated.patientId
    });
    return res.json({ ok: true, data: updated });
  } catch (error) {
    next(error);
  }
}
async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });
    return res.json({ ok: true, data: notifications });
  } catch (error) {
    next(error);
  }
}

// src/modules/appointments/appointments.router.ts
var router4 = (0, import_express4.Router)();
router4.use(requireAuth);
router4.get("/doctors", getAvailableDoctors);
router4.get("/", getAppointments);
router4.get("/notifications", getNotifications);
router4.post(
  "/",
  validate(createAppointmentInputSchema),
  auditLog("CREATE_APPOINTMENT", "Appointment"),
  bookAppointment
);
router4.put(
  "/:id/reschedule",
  validate(rescheduleAppointmentInputSchema),
  auditLog("RESCHEDULE_APPOINTMENT", "Appointment"),
  reschedule
);
router4.put(
  "/:id/cancel",
  auditLog("CANCEL_APPOINTMENT", "Appointment"),
  cancel
);

// src/modules/admin/admin.router.ts
var import_express5 = require("express");
var router5 = (0, import_express5.Router)();
router5.use(requireAuth);
router5.use(requireRole(["admin"]));
router5.get("/patients", getPatients);
router5.get("/doctors", getDoctors);
router5.get("/appointments", getAppointmentsAdmin);
router5.get("/analytics", getAnalytics);
router5.get("/analytics/live", getLiveAnalytics);
router5.get("/audit-logs", getAuditLogs);
router5.get("/audit-logs/export", exportAuditLogs);
router5.post(
  "/doctors",
  validate(createDoctorInputSchema),
  auditLog("CREATE_DOCTOR", "Doctor"),
  createDoctor
);
router5.put(
  "/doctors/:id/availability",
  validate(doctorAvailabilityInputSchema),
  auditLog("UPDATE_DOCTOR_AVAILABILITY", "DoctorAvailability"),
  updateAvailability
);
router5.post(
  "/clinics/:id/holidays",
  validate(clinicHolidayInputSchema),
  auditLog("ADD_CLINIC_HOLIDAY", "ClinicHoliday"),
  addHoliday
);
router5.get("/clinics", getClinics);
router5.patch(
  "/clinics/:id",
  auditLog("UPDATE_CLINIC", "Clinic"),
  updateClinic
);
router5.post(
  "/doctors/:id/leaves",
  validate(doctorLeaveInputSchema),
  auditLog("ADD_DOCTOR_LEAVE", "DoctorLeave"),
  addLeave
);
router5.post(
  "/queue/add",
  auditLog("ADMIN_ADD_TO_QUEUE", "QueueEntry"),
  adminAddQueueEntry
);
router5.patch(
  "/queue/:entryId",
  auditLog("ADMIN_EDIT_QUEUE_ENTRY", "QueueEntry"),
  adminEditQueueEntry
);
router5.delete(
  "/queue/:entryId",
  auditLog("ADMIN_REMOVE_FROM_QUEUE", "QueueEntry"),
  adminDeleteQueueEntry
);

// src/modules/doctor/doctor.router.ts
var import_express6 = require("express");

// src/modules/doctor/doctor.controller.ts
init_src3();
async function getTodayAppointments(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const today = getClinicDayRange();
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        slotTime: { gte: today.start, lte: today.end },
        status: { notIn: ["cancelled", "no_show"] }
      },
      include: {
        patient: {
          include: {
            profile: {
              select: { name: true, phone: true, email: true }
            }
          }
        },
        notes: true,
        queueEntry: true
      },
      orderBy: { slotTime: "asc" }
    });
    return res.json({ ok: true, data: appointments });
  } catch (error) {
    next(error);
  }
}
async function getDoctorProfile(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: {
        profile: {
          select: { id: true, name: true, email: true, phone: true }
        },
        clinic: true,
        availabilities: true,
        leaves: {
          where: { date: { gte: /* @__PURE__ */ new Date() } },
          orderBy: { date: "asc" }
        },
        queueSessions: {
          orderBy: { sessionDate: "desc" },
          take: 1
        }
      }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    return res.json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
}
async function goOnline(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isOnline: true, onlineSince: /* @__PURE__ */ new Date() }
    });
    const todayDate = getClinicSessionDateForDate();
    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });
    if (session) {
      session = await prisma.queueSession.update({
        where: { id: session.id },
        data: { status: "active" }
      });
    } else {
      session = await prisma.queueSession.create({
        data: { doctorId: doctor.id, sessionDate: todayDate, currentToken: 1, status: "active" }
      });
    }
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(doctor.clinicId);
    broadcastQueueUpdate2(doctor.clinicId, snapshot);
    return res.json({ ok: true, data: { doctor: updatedDoctor, session } });
  } catch (error) {
    next(error);
  }
}
async function pauseQueue(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const todayDate = getClinicSessionDateForDate();
    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });
    if (!session) {
      return res.status(400).json({ ok: false, error: "No active queue session found for today" });
    }
    session = await prisma.queueSession.update({
      where: { id: session.id },
      data: { status: "paused" }
    });
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(doctor.clinicId);
    broadcastQueueUpdate2(doctor.clinicId, snapshot);
    return res.json({ ok: true, data: { session } });
  } catch (error) {
    next(error);
  }
}
async function goOffline(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const updatedDoctor = await prisma.doctor.update({
      where: { id: doctor.id },
      data: { isOnline: false, onlineSince: null }
    });
    const todayDate = getClinicSessionDateForDate();
    let session = await prisma.queueSession.findFirst({
      where: { doctorId: doctor.id, sessionDate: todayDate }
    });
    if (session) {
      session = await prisma.queueSession.update({
        where: { id: session.id },
        data: { status: "closed" }
      });
      const waitingEntries = await prisma.queueEntry.findMany({
        where: { sessionId: session.id, status: "waiting" },
        include: { appointment: { include: { patient: { include: { profile: true } } } } }
      });
      const { notificationQueue: notificationQueue2 } = await Promise.resolve().then(() => (init_queue(), queue_exports));
      for (const entry of waitingEntries) {
        await prisma.queueEntry.update({
          where: { id: entry.id },
          data: { status: "no_show" }
        });
        await prisma.appointment.update({
          where: { id: entry.appointmentId },
          data: { status: "cancelled" }
        });
        if (entry.appointment?.patient?.profile?.email) {
          await notificationQueue2.add("send-booking-cancellation", {
            appointmentId: entry.appointmentId,
            patientId: entry.appointment.patientId,
            email: entry.appointment.patient.profile.email,
            reason: `Dr. ${doctor.profile.name} went offline. Please reschedule your appointment.`
          });
        }
      }
    }
    const { getLiveQueueSnapshot: getLiveQueueSnapshot2 } = await Promise.resolve().then(() => (init_src3(), src_exports2));
    const { broadcastQueueUpdate: broadcastQueueUpdate2 } = await Promise.resolve().then(() => (init_socket(), socket_exports));
    const snapshot = await getLiveQueueSnapshot2(doctor.clinicId);
    broadcastQueueUpdate2(doctor.clinicId, snapshot);
    return res.json({ ok: true, data: { doctor: updatedDoctor, session } });
  } catch (error) {
    next(error);
  }
}
async function updateDoctorProfile(req, res, next) {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { profileId: req.user?.id },
      include: { profile: true }
    });
    if (!doctor) {
      return res.status(404).json({ ok: false, error: "Doctor profile not found" });
    }
    const { name, phone, avatarUrl, bio, qualifications, yearsExperience, languages, consultationFee, specialty } = req.body;
    const profileUpdate = {};
    if (name !== void 0) profileUpdate.name = name;
    if (phone !== void 0) profileUpdate.phone = phone;
    if (avatarUrl !== void 0) profileUpdate.avatarUrl = avatarUrl;
    if (Object.keys(profileUpdate).length > 0) {
      await prisma.profile.update({
        where: { id: doctor.profileId },
        data: profileUpdate
      });
    }
    const doctorUpdate = {};
    if (bio !== void 0) doctorUpdate.bio = bio;
    if (qualifications !== void 0) doctorUpdate.qualifications = qualifications;
    if (yearsExperience !== void 0) doctorUpdate.yearsExperience = typeof yearsExperience === "number" ? yearsExperience : parseInt(yearsExperience, 10);
    if (languages !== void 0) doctorUpdate.languages = Array.isArray(languages) ? languages.join(",") : languages;
    if (consultationFee !== void 0) doctorUpdate.consultationFee = typeof consultationFee === "number" ? consultationFee : parseInt(consultationFee, 10);
    if (specialty !== void 0) doctorUpdate.specialty = specialty;
    let updatedDoctor = doctor;
    if (Object.keys(doctorUpdate).length > 0) {
      updatedDoctor = await prisma.doctor.update({
        where: { id: doctor.id },
        data: doctorUpdate,
        include: { profile: true }
      });
    } else {
      updatedDoctor = await prisma.doctor.findUnique({
        where: { id: doctor.id },
        include: { profile: true }
      });
    }
    return res.json({ ok: true, data: updatedDoctor });
  } catch (error) {
    next(error);
  }
}

// src/modules/doctor/doctor.router.ts
var router6 = (0, import_express6.Router)();
router6.use(requireAuth);
router6.use(requireRole(["doctor"]));
router6.get("/today", getTodayAppointments);
router6.get("/profile", getDoctorProfile);
router6.patch("/profile", updateDoctorProfile);
router6.post("/status/online", goOnline);
router6.post("/status/pause", pauseQueue);
router6.post("/status/offline", goOffline);

// src/modules/doctor/doctors.public.router.ts
var import_express7 = require("express");
init_src2();
var doctorsPublicRouter = (0, import_express7.Router)();
doctorsPublicRouter.get("/", async (req, res, next) => {
  try {
    const doctors = await prisma.doctor.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        specialty: true,
        isOnline: true,
        yearsExperience: true,
        consultationFee: true,
        languages: true,
        profile: {
          select: {
            name: true,
            avatarUrl: true
          }
        },
        clinic: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        profile: {
          name: "asc"
        }
      }
    });
    res.json({ ok: true, data: doctors });
  } catch (error) {
    next(error);
  }
});
doctorsPublicRouter.get("/:id", async (req, res, next) => {
  try {
    const doctorId = req.params.id;
    const doctor = await prisma.doctor.findUnique({
      where: {
        id: doctorId,
        deletedAt: null
      },
      select: {
        id: true,
        specialty: true,
        isOnline: true,
        bio: true,
        qualifications: true,
        yearsExperience: true,
        languages: true,
        consultationFee: true,
        profile: {
          select: {
            name: true,
            avatarUrl: true
          }
        },
        clinic: {
          select: {
            name: true
          }
        },
        availabilities: {
          select: {
            weekday: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });
    if (!doctor) {
      res.status(404).json({ ok: false, error: "Doctor not found" });
      return;
    }
    res.json({ ok: true, data: doctor });
  } catch (error) {
    next(error);
  }
});

// src/modules/ai/ai.router.ts
var import_express8 = require("express");

// ../../packages/ai/src/core/constants.ts
var AI_MODELS = {
  DEFAULT: "llama-3.3-70b-versatile",
  POWERFUL: "llama-3.3-70b-versatile",
  FAST: "llama-3.1-8b-instant"
};
var AGENT_NAMES = {
  APPOINTMENT_ASSISTANT: "appointment-assistant",
  QUEUE_INTELLIGENCE: "queue-intelligence",
  DOCTOR_NOTE_ASSISTANT: "doctor-note-assistant",
  REMINDER_AGENT: "reminder-agent",
  ADMIN_INSIGHTS: "admin-insights"
};
var AGENT_ROLE_ACCESS = {
  [AGENT_NAMES.APPOINTMENT_ASSISTANT]: ["patient"],
  [AGENT_NAMES.QUEUE_INTELLIGENCE]: ["patient", "doctor", "admin"],
  [AGENT_NAMES.DOCTOR_NOTE_ASSISTANT]: ["doctor"],
  [AGENT_NAMES.REMINDER_AGENT]: ["admin"],
  [AGENT_NAMES.ADMIN_INSIGHTS]: ["admin"]
};

// ../../packages/ai/src/core/base-state.ts
var import_zod3 = require("zod");
var AgentRequestSchema = import_zod3.z.object({
  clinic_id: import_zod3.z.string().uuid(),
  user_id: import_zod3.z.string().uuid(),
  role: import_zod3.z.enum(["patient", "doctor", "admin"]),
  message: import_zod3.z.string().min(1).max(2e3),
  thread_id: import_zod3.z.string().optional(),
  appointment_id: import_zod3.z.string().uuid().optional()
});
function createBaseState(req) {
  const now = (/* @__PURE__ */ new Date()).toISOString();
  return {
    request_id: crypto.randomUUID(),
    thread_id: req.thread_id || crypto.randomUUID(),
    clinic_id: req.clinic_id,
    user_id: req.user_id,
    role: req.role,
    appointment_id: req.appointment_id,
    messages: [{ role: "user", content: req.message }],
    current_goal: void 0,
    tool_results: [],
    final_output: void 0,
    approval_required: false,
    approval_status: void 0,
    error: void 0,
    metadata: {},
    created_at: now,
    updated_at: now
  };
}

// ../../packages/ai/src/core/model-registry.ts
var import_openai = require("@langchain/openai");
var modelCache = /* @__PURE__ */ new Map();
function getModel(modelName = AI_MODELS.DEFAULT, options = {}) {
  const cacheKey = `${modelName}:${options.temperature ?? 0}:${options.maxTokens ?? 1024}`;
  if (modelCache.has(cacheKey)) {
    return modelCache.get(cacheKey);
  }
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GROQ_API_KEY is not set. Set it in .env to enable AI agent functionality."
    );
  }
  const model = new import_openai.ChatOpenAI({
    model: modelName,
    temperature: options.temperature ?? 0,
    maxTokens: options.maxTokens ?? 1024,
    apiKey,
    configuration: {
      baseURL: "https://api.groq.com/openai/v1"
    }
  });
  modelCache.set(cacheKey, model);
  return model;
}
function isAIConfigured() {
  return !!process.env.GROQ_API_KEY;
}

// ../../packages/ai/src/core/policies.ts
function checkPolicy(ctx) {
  const allowedRoles = AGENT_ROLE_ACCESS[ctx.agent_name];
  if (!allowedRoles || !allowedRoles.includes(ctx.user_role)) {
    return {
      allowed: false,
      reason: `Role '${ctx.user_role}' is not authorized to use agent '${ctx.agent_name}'.`
    };
  }
  if (ctx.resource_clinic_id && ctx.resource_clinic_id !== ctx.clinic_id) {
    return {
      allowed: false,
      reason: "Cross-clinic access denied. Resources must belong to the user's clinic."
    };
  }
  if (ctx.user_role === "patient" && ctx.resource_owner_id && ctx.resource_owner_id !== ctx.user_id) {
    return {
      allowed: false,
      reason: "Patients can only access their own records."
    };
  }
  if (ctx.action === "mutate") {
    return {
      allowed: true,
      requires_approval: true,
      reason: "Mutation actions require human approval before execution."
    };
  }
  return { allowed: true };
}
function enforcePolicy(ctx) {
  const result = checkPolicy(ctx);
  if (!result.allowed) {
    throw new PolicyDeniedError(result.reason || "Policy check failed.");
  }
}
var PolicyDeniedError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PolicyDeniedError";
  }
};

// ../../packages/ai/src/core/guardrails.ts
function addMedicalDisclaimer(output) {
  if (output.type === "draft") {
    output.disclaimer = "\u26A0\uFE0F AI-GENERATED DRAFT \u2014 This content was generated by AI and must be reviewed and confirmed by the doctor before being saved to the patient record.";
  }
  return output;
}

// ../../packages/ai/src/core/tracing.ts
function logAgentEvent(ctx, event, data) {
  const entry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: "info",
    service: "ai-agent",
    agent: ctx.agent_name,
    request_id: ctx.request_id,
    thread_id: ctx.thread_id,
    user_id: ctx.user_id,
    clinic_id: ctx.clinic_id,
    event,
    ...sanitizeLogData(data)
  };
  console.log(JSON.stringify(entry));
}
function logAgentError(ctx, error, data) {
  const entry = {
    timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    level: "error",
    service: "ai-agent",
    agent: ctx.agent_name,
    request_id: ctx.request_id,
    thread_id: ctx.thread_id,
    user_id: ctx.user_id,
    clinic_id: ctx.clinic_id,
    error: error.message,
    stack: process.env.NODE_ENV === "development" ? error.stack : void 0,
    ...sanitizeLogData(data)
  };
  console.error(JSON.stringify(entry));
}
function sanitizeLogData(data) {
  if (!data) return {};
  const sanitized = { ...data };
  const sensitiveKeys = ["notes", "diagnosis", "raw_note", "patient_name", "phone", "email", "password"];
  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = "[REDACTED]";
    }
  }
  return sanitized;
}

// ../../packages/ai/src/agents/appointment-assistant/nodes.ts
var import_messages = require("@langchain/core/messages");

// ../../packages/ai/src/agents/appointment-assistant/prompts.ts
var APPOINTMENT_ASSISTANT_SYSTEM_PROMPT = `You are a clinic appointment assistant. You help patients find available doctors, check appointment availability, and guide them through the booking process.

ROLE: Patient-facing assistant for a clinic appointment system.

ALLOWED ACTIONS:
- Search for available doctors by specialty
- Check doctor availability for a specific date
- Show the patient's upcoming appointments
- Validate if a booking slot is available
- Answer common booking FAQs (clinic hours, what to bring, etc.)
- Suggest available time slots

NEVER DO:
- Create, modify, or cancel appointments directly \u2014 only validate and suggest
- Access other patients' records
- Provide medical advice or diagnoses
- Share doctor personal information beyond name and specialty
- Make promises about specific wait times
- Access data from other clinics

BEHAVIOR:
- Be concise and helpful
- If the patient's request is unclear, ask for clarification
- Always present structured options when multiple choices exist
- If a slot is unavailable, proactively suggest alternatives
- Use the tools provided to fetch real-time data \u2014 never guess
- Tools are already scoped to the authenticated clinic and patient; do not ask for or invent clinic_id or patient_id values

OUTPUT FORMAT:
- Always respond with a clear, actionable message
- Include suggested_actions when the user can take a next step
- Include available_slots when showing availability data`;

// ../../packages/ai/src/agents/appointment-assistant/tools.ts
var import_tools = require("@langchain/core/tools");
var import_zod4 = require("zod");

// ../../packages/ai/src/integration/appointment-hooks.ts
init_src2();
async function getDoctorAvailability(clinicId, doctorId, date) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId, deletedAt: null },
    include: {
      availabilities: true,
      leaves: { where: { date: new Date(date) } }
    }
  });
  if (!doctor) return null;
  const dayOfWeek = new Date(date).getDay();
  const slots = doctor.availabilities.filter((a) => a.weekday === dayOfWeek);
  const isOnLeave = doctor.leaves.length > 0;
  return {
    doctor_id: doctor.id,
    date,
    is_on_leave: isOnLeave,
    available_slots: isOnLeave ? [] : slots.map((s) => ({
      start_time: s.startTime,
      end_time: s.endTime
    })),
    slot_duration_min: doctor.slotDurationMin,
    max_patients_per_slot: doctor.maxPatientsPerSlot
  };
}
async function searchAvailableSlots(clinicId, specialty, dateRange) {
  const doctors = await prisma.doctor.findMany({
    where: {
      clinicId,
      deletedAt: null,
      ...specialty ? { specialty } : {}
    },
    include: {
      profile: { select: { name: true } },
      availabilities: true
    }
  });
  return doctors.map((doc) => ({
    doctor_id: doc.id,
    doctor_name: doc.profile?.name ?? "Unknown",
    specialty: doc.specialty || "General",
    slot_duration_min: doc.slotDurationMin,
    weekly_availability: doc.availabilities.map((a) => ({
      weekday: a.weekday,
      start_time: a.startTime,
      end_time: a.endTime
    }))
  }));
}
async function getPatientUpcomingAppointments(patientId, clinicId) {
  const appointments = await prisma.appointment.findMany({
    where: {
      patientId,
      clinicId,
      slotTime: { gte: /* @__PURE__ */ new Date() },
      status: { notIn: ["cancelled", "no_show", "completed"] }
    },
    include: {
      doctor: {
        include: { profile: { select: { name: true } } }
      }
    },
    orderBy: { slotTime: "asc" }
  });
  return appointments.map((a) => ({
    appointment_id: a.id,
    doctor_name: a.doctor.profile?.name ?? "Unknown",
    slot_time: a.slotTime.toISOString(),
    token_no: a.tokenNo,
    status: a.status
  }));
}
async function listClinicDoctors(clinicId) {
  const doctors = await prisma.doctor.findMany({
    where: { clinicId, deletedAt: null },
    include: {
      profile: { select: { name: true, email: true } }
    }
  });
  return doctors.map((d) => ({
    doctor_id: d.id,
    name: d.profile?.name ?? "Unknown",
    specialty: d.specialty || "General",
    slot_duration_min: d.slotDurationMin
  }));
}
async function validateBookingRequest(patientId, doctorId, clinicId, slotTime) {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, clinicId, deletedAt: null }
  });
  if (!doctor) return { valid: false, reason: "Doctor not found in this clinic." };
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      slotTime: new Date(slotTime),
      status: { notIn: ["cancelled", "no_show"] }
    }
  });
  if (conflict) return { valid: false, reason: "This slot is already booked." };
  const patientConflict = await prisma.appointment.findFirst({
    where: {
      patientId,
      slotTime: new Date(slotTime),
      status: { notIn: ["cancelled", "no_show"] }
    }
  });
  if (patientConflict) return { valid: false, reason: "You already have an appointment at this time." };
  return { valid: true };
}

// ../../packages/ai/src/agents/appointment-assistant/tools.ts
function createAppointmentAssistantTools(ctx) {
  const searchDoctorsTool = (0, import_tools.tool)(
    async (input) => {
      const specialty = input.specialty ?? void 0;
      const results = await searchAvailableSlots(ctx.clinic_id, specialty);
      return JSON.stringify(results);
    },
    {
      name: "search_doctors",
      description: "Search for available doctors in the authenticated clinic, optionally filtered by specialty.",
      schema: import_zod4.z.object({
        specialty: import_zod4.z.string().nullable().optional().describe("Filter by specialty (e.g., 'Cardiology', 'General')")
      })
    }
  );
  const checkAvailabilityTool = (0, import_tools.tool)(
    async (input) => {
      const result = await getDoctorAvailability(ctx.clinic_id, input.doctor_id, input.date);
      return JSON.stringify(result);
    },
    {
      name: "check_doctor_availability",
      description: "Check a specific doctor's availability for a given date in the authenticated clinic.",
      schema: import_zod4.z.object({
        doctor_id: import_zod4.z.string().describe("The doctor ID to check"),
        date: import_zod4.z.string().describe("Date in YYYY-MM-DD format")
      })
    }
  );
  const myAppointmentsTool = (0, import_tools.tool)(
    async () => {
      const results = await getPatientUpcomingAppointments(ctx.patient_id, ctx.clinic_id);
      return JSON.stringify(results);
    },
    {
      name: "get_my_appointments",
      description: "Get the authenticated patient's upcoming appointments.",
      schema: import_zod4.z.object({})
    }
  );
  const validateBookingTool = (0, import_tools.tool)(
    async (input) => {
      const result = await validateBookingRequest(ctx.patient_id, input.doctor_id, ctx.clinic_id, input.slot_time);
      return JSON.stringify(result);
    },
    {
      name: "validate_booking",
      description: "Validate if a booking slot is available. Does NOT create the appointment; only checks feasibility.",
      schema: import_zod4.z.object({
        doctor_id: import_zod4.z.string().describe("The doctor ID"),
        slot_time: import_zod4.z.string().describe("ISO datetime string for the slot")
      })
    }
  );
  const listDoctorsTool = (0, import_tools.tool)(
    async () => {
      const results = await listClinicDoctors(ctx.clinic_id);
      return JSON.stringify(results);
    },
    {
      name: "list_clinic_doctors",
      description: "List all active doctors in the authenticated clinic.",
      schema: import_zod4.z.object({})
    }
  );
  return [
    searchDoctorsTool,
    checkAvailabilityTool,
    myAppointmentsTool,
    validateBookingTool,
    listDoctorsTool
  ];
}

// ../../packages/ai/src/agents/appointment-assistant/nodes.ts
function makeTraceCtx(state) {
  return {
    request_id: state.request_id,
    thread_id: state.thread_id,
    agent_name: AGENT_NAMES.APPOINTMENT_ASSISTANT,
    user_id: state.user_id,
    clinic_id: state.clinic_id
  };
}
function validateScope(state) {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "validate_scope");
  enforcePolicy({
    agent_name: AGENT_NAMES.APPOINTMENT_ASSISTANT,
    user_role: state.role,
    user_id: state.user_id,
    clinic_id: state.clinic_id,
    action: "read"
  });
  return { ...state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
async function reason(state) {
  const trace = makeTraceCtx(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const appointmentAssistantTools = createAppointmentAssistantTools({
      clinic_id: state.clinic_id,
      patient_id: state.patient_id
    });
    const modelWithTools = model.bindTools(appointmentAssistantTools);
    const messages = [
      new import_messages.SystemMessage(
        APPOINTMENT_ASSISTANT_SYSTEM_PROMPT + `

Context: clinic_id=${state.clinic_id}, patient_id=${state.patient_id}`
      ),
      ...state.messages.map((m) => {
        if (m.role === "user") return new import_messages.HumanMessage(m.content);
        return new import_messages.AIMessage(m.content);
      })
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matchedTool = appointmentAssistantTools.find((t) => t.name === tc.name);
        if (matchedTool) {
          try {
            const result = await matchedTool.invoke(tc.args);
            toolResults.push({ tool: tc.name, result });
          } catch (err) {
            toolResults.push({ tool: tc.name, result: null, error: err.message });
          }
        }
      }
      const toolMessages = toolResults.map(
        (tr) => new import_messages.HumanMessage(`Tool '${tr.tool}' returned: ${JSON.stringify(tr.result)}${tr.error ? ` (Error: ${tr.error})` : ""}`)
      );
      const finalResponse = await model.invoke([...messages, new import_messages.AIMessage(responseContent), ...toolMessages]);
      const finalContent = typeof finalResponse.content === "string" ? finalResponse.content : JSON.stringify(finalResponse.content);
      logAgentEvent(trace, "reason_complete", { tool_calls: toolResults.length });
      return {
        ...state,
        messages: [...state.messages, { role: "assistant", content: finalContent }],
        tool_results: toolResults,
        final_output: { type: "suggestion", content: finalContent },
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
    }
    logAgentEvent(trace, "reason_complete", { tool_calls: 0 });
    return {
      ...state,
      messages: [...state.messages, { role: "assistant", content: responseContent }],
      final_output: { type: "suggestion", content: responseContent },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  } catch (err) {
    logAgentError(trace, err);
    return {
      ...state,
      error: err.message,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
}
function handleError(state) {
  const fallbackMessage = "I'm sorry, I encountered an issue processing your request. Please try again or contact the clinic directly.";
  return {
    ...state,
    final_output: { type: "suggestion", content: fallbackMessage },
    messages: [...state.messages, { role: "assistant", content: fallbackMessage }],
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// ../../packages/ai/src/core/langgraph-runner.ts
var import_langgraph = require("@langchain/langgraph");
function toErrorMessage(error) {
  return error instanceof Error ? error.message : "Unknown agent graph error.";
}
async function runBoundedAgentGraph({
  name,
  initialState,
  validateScope: validateScope6,
  run,
  handleError: handleError6
}) {
  const GraphState = import_langgraph.Annotation.Root({
    state: (0, import_langgraph.Annotation)()
  });
  const graph = new import_langgraph.StateGraph(GraphState).addNode("validate_scope", (input) => {
    try {
      return { state: validateScope6(input.state) };
    } catch (error) {
      return {
        state: {
          ...input.state,
          error: toErrorMessage(error),
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }
      };
    }
  }).addNode("run", async (input) => ({ state: await run(input.state) })).addNode("handle_error", (input) => ({ state: handleError6(input.state) })).addEdge(import_langgraph.START, "validate_scope").addConditionalEdges(
    "validate_scope",
    (input) => input.state.error && !input.state.final_output ? "handle_error" : "run",
    { handle_error: "handle_error", run: "run" }
  ).addConditionalEdges(
    "run",
    (input) => input.state.error && !input.state.final_output ? "handle_error" : "end",
    { handle_error: "handle_error", end: import_langgraph.END }
  ).addEdge("handle_error", import_langgraph.END).compile({ checkpointer: new import_langgraph.MemorySaver(), name });
  const result = await graph.invoke(
    { state: initialState },
    { configurable: { thread_id: initialState.thread_id } }
  );
  return result.state;
}

// ../../packages/ai/src/agents/appointment-assistant/graph.ts
async function runAppointmentAssistantGraph(initialState) {
  return runBoundedAgentGraph({
    name: "appointment-assistant",
    initialState,
    validateScope,
    run: reason,
    handleError
  });
}

// ../../packages/ai/src/agents/appointment-assistant/service.ts
init_src2();
async function invokeAppointmentAssistant(req) {
  const patient = await prisma.patient.findUnique({
    where: { profileId: req.user_id }
  });
  if (!patient) {
    return {
      ok: false,
      error: "Patient profile not found. Only patients can use the appointment assistant."
    };
  }
  const baseState = createBaseState(req);
  const state = {
    ...baseState,
    patient_id: patient.id
  };
  const result = await runAppointmentAssistantGraph(state);
  return {
    ok: !result.error,
    data: {
      thread_id: result.thread_id,
      response: result.final_output?.content,
      type: result.final_output?.type,
      suggested_actions: void 0
      // Future: parse structured output
    },
    error: result.error
  };
}

// ../../packages/ai/src/agents/queue-intelligence/nodes.ts
var import_messages2 = require("@langchain/core/messages");

// ../../packages/ai/src/agents/queue-intelligence/prompts.ts
var QUEUE_INTELLIGENCE_SYSTEM_PROMPT = `You are a queue intelligence assistant for a clinic. You provide real-time queue status, wait time estimates, and delay explanations.

ROLE: Queue status assistant for patients, doctors, and admins.

ALLOWED ACTIONS:
- Get the current queue snapshot (who is being served, how many waiting)
- Estimate wait time based on current queue data
- Check a specific patient's position in the queue
- Explain delays or unusual wait times
- Summarize queue health for admin/doctor dashboards

NEVER DO:
- Modify the queue (advance, skip, reorder patients)
- Set or change the current token number
- Provide medical information
- Access patient medical records

BEHAVIOR:
- Use actual queue data from tools \u2014 never fabricate numbers
- Tools are already scoped to the authenticated clinic; patients are automatically scoped to their own queue position
- Present wait times as estimates, not guarantees
- For patients: be reassuring and clear about their position
- For doctors/admins: be data-driven and concise`;

// ../../packages/ai/src/agents/queue-intelligence/tools.ts
var import_tools3 = require("@langchain/core/tools");
var import_zod5 = require("zod");

// ../../packages/ai/src/integration/queue-hooks.ts
init_src3();
init_src2();
async function getCurrentQueueSnapshot(clinicId) {
  return getLiveQueueSnapshot(clinicId);
}
async function getAverageWaitTime(clinicId, doctorId) {
  const todayDate = getClinicSessionDateForDate();
  const whereClause = {
    sessionDate: todayDate,
    ...doctorId ? { doctorId } : {}
  };
  if (!doctorId) {
    const doctors = await prisma.doctor.findMany({
      where: { clinicId, deletedAt: null },
      select: { id: true }
    });
    whereClause.doctorId = { in: doctors.map((d) => d.id) };
    delete whereClause.sessionDate;
    Object.assign(whereClause, { sessionDate: todayDate });
  }
  const sessions = await prisma.queueSession.findMany({
    where: whereClause,
    include: {
      entries: { where: { status: "waiting" } }
    }
  });
  const totalWaiting = sessions.reduce((acc, s) => acc + s.entries.length, 0);
  const estimatedMinutes = totalWaiting * 15;
  return {
    clinic_id: clinicId,
    doctor_id: doctorId || "all",
    total_waiting: totalWaiting,
    estimated_wait_minutes: estimatedMinutes,
    sessions_active: sessions.length,
    snapshot_time: (/* @__PURE__ */ new Date()).toISOString()
  };
}
async function getQueuePositionForPatient(clinicId, patientId) {
  const today = getClinicDayRange();
  const appointment = await prisma.appointment.findFirst({
    where: {
      patientId,
      clinicId,
      slotTime: { gte: today.start, lte: today.end },
      status: { in: ["booked", "in_consultation"] }
    },
    include: { queueEntry: true },
    orderBy: { slotTime: "asc" }
  });
  if (!appointment || !appointment.queueEntry) {
    return { in_queue: false, position: null, message: "You are not currently in the queue." };
  }
  const ahead = await prisma.queueEntry.count({
    where: {
      sessionId: appointment.queueEntry.sessionId,
      position: { lt: appointment.queueEntry.position },
      status: "waiting"
    }
  });
  return {
    in_queue: true,
    position: ahead + 1,
    token_no: appointment.tokenNo,
    status: appointment.queueEntry.status,
    message: ahead === 0 ? "You are next! Please be ready." : `You are ${ahead} patient${ahead > 1 ? "s" : ""} away from your turn.`
  };
}

// ../../packages/ai/src/agents/queue-intelligence/tools.ts
function createQueueIntelligenceTools(ctx) {
  const queueSnapshotTool = (0, import_tools3.tool)(
    async () => {
      const result = await getCurrentQueueSnapshot(ctx.clinic_id);
      return JSON.stringify(result);
    },
    {
      name: "get_queue_snapshot",
      description: "Get the current live queue snapshot for the authenticated clinic.",
      schema: import_zod5.z.object({})
    }
  );
  const waitTimeTool = (0, import_tools3.tool)(
    async (input) => {
      const result = await getAverageWaitTime(ctx.clinic_id, input.doctor_id ?? void 0);
      return JSON.stringify(result);
    },
    {
      name: "get_wait_time",
      description: "Estimate current wait time in the authenticated clinic, optionally for a specific doctor.",
      schema: import_zod5.z.object({
        doctor_id: import_zod5.z.string().nullable().optional()
      })
    }
  );
  const patientPositionTool = (0, import_tools3.tool)(
    async (input) => {
      const patientId = ctx.role === "patient" ? ctx.patient_id : input.patient_id;
      if (!patientId) {
        throw new Error("Patient context is required to check queue position.");
      }
      const result = await getQueuePositionForPatient(ctx.clinic_id, patientId);
      return JSON.stringify(result);
    },
    {
      name: "get_patient_position",
      description: "Get queue position. Patients are automatically scoped to themselves; doctors/admins may provide a patient ID within the clinic.",
      schema: import_zod5.z.object({
        patient_id: import_zod5.z.string().nullable().optional()
      })
    }
  );
  return [queueSnapshotTool, waitTimeTool, patientPositionTool];
}

// ../../packages/ai/src/agents/queue-intelligence/nodes.ts
function makeTraceCtx2(state) {
  return {
    request_id: state.request_id,
    thread_id: state.thread_id,
    agent_name: AGENT_NAMES.QUEUE_INTELLIGENCE,
    user_id: state.user_id,
    clinic_id: state.clinic_id
  };
}
function validateScope2(state) {
  enforcePolicy({
    agent_name: AGENT_NAMES.QUEUE_INTELLIGENCE,
    user_role: state.role,
    user_id: state.user_id,
    clinic_id: state.clinic_id,
    action: "read"
  });
  return { ...state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
async function reason2(state) {
  const trace = makeTraceCtx2(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const queueIntelligenceTools = createQueueIntelligenceTools({
      clinic_id: state.clinic_id,
      role: state.role,
      patient_id: state.patient_id
    });
    const modelWithTools = model.bindTools(queueIntelligenceTools);
    const messages = [
      new import_messages2.SystemMessage(
        QUEUE_INTELLIGENCE_SYSTEM_PROMPT + `
Context: clinic_id=${state.clinic_id}, role=${state.role}, patient_id=${state.patient_id ?? "none"}`
      ),
      ...state.messages.map((m) => m.role === "user" ? new import_messages2.HumanMessage(m.content) : new import_messages2.AIMessage(m.content))
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    if (response.tool_calls?.length) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matched = queueIntelligenceTools.find((t) => t.name === tc.name);
        if (matched) {
          try {
            toolResults.push({ tool: tc.name, result: await matched.invoke(tc.args) });
          } catch (e) {
            toolResults.push({ tool: tc.name, result: null, error: e.message });
          }
        }
      }
      const toolMsgs = toolResults.map((tr) => new import_messages2.HumanMessage(`Tool '${tr.tool}': ${JSON.stringify(tr.result)}`));
      const final = await model.invoke([...messages, new import_messages2.AIMessage(responseContent), ...toolMsgs]);
      const finalContent = typeof final.content === "string" ? final.content : JSON.stringify(final.content);
      return { ...state, messages: [...state.messages, { role: "assistant", content: finalContent }], tool_results: toolResults, final_output: { type: "suggestion", content: finalContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    return { ...state, messages: [...state.messages, { role: "assistant", content: responseContent }], final_output: { type: "suggestion", content: responseContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  } catch (err) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
function handleError2(state) {
  const msg = "I'm sorry, I couldn't fetch the queue information right now. Please check the live queue display directly.";
  return { ...state, final_output: { type: "suggestion", content: msg }, messages: [...state.messages, { role: "assistant", content: msg }] };
}

// ../../packages/ai/src/agents/queue-intelligence/graph.ts
async function runQueueIntelligenceGraph(initialState) {
  return runBoundedAgentGraph({
    name: "queue-intelligence",
    initialState,
    validateScope: validateScope2,
    run: reason2,
    handleError: handleError2
  });
}

// ../../packages/ai/src/agents/queue-intelligence/service.ts
init_src2();
async function invokeQueueIntelligence(req) {
  const baseState = createBaseState(req);
  const [patient, doctor] = await Promise.all([
    req.role === "patient" ? prisma.patient.findUnique({ where: { profileId: req.user_id } }) : Promise.resolve(null),
    req.role === "doctor" ? prisma.doctor.findUnique({ where: { profileId: req.user_id } }) : Promise.resolve(null)
  ]);
  const state = {
    ...baseState,
    patient_id: patient?.id,
    doctor_id: doctor?.id
  };
  const result = await runQueueIntelligenceGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error
  };
}

// ../../packages/ai/src/agents/doctor-note-assistant/nodes.ts
var import_messages3 = require("@langchain/core/messages");

// ../../packages/ai/src/agents/doctor-note-assistant/prompts.ts
var DOCTOR_NOTE_SYSTEM_PROMPT = `You are a clinical documentation assistant. You help doctors convert rough notes and dictation into structured, clean consultation summaries.

ROLE: Doctor-facing note drafting assistant.

ALLOWED ACTIONS:
- Convert rough dictation text into a structured note with sections: Chief Complaint, History, Examination, Diagnosis, Plan, Follow-up
- Extract key symptoms and diagnosis from unstructured text
- Suggest follow-up recommendations based on the diagnosis
- Review and improve existing notes for clarity

NEVER DO:
- Make diagnostic decisions \u2014 you only organize what the doctor dictates
- Save notes directly \u2014 all saves go through the validated backend endpoint
- Access patient records from other doctors
- Provide treatment recommendations beyond organizing what was dictated

OUTPUT: Always mark your output as AI-GENERATED DRAFT. The doctor must review and confirm before saving.`;

// ../../packages/ai/src/agents/doctor-note-assistant/nodes.ts
function makeTraceCtx3(state) {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.DOCTOR_NOTE_ASSISTANT, user_id: state.user_id, clinic_id: state.clinic_id };
}
function validateScope3(state) {
  enforcePolicy({ agent_name: AGENT_NAMES.DOCTOR_NOTE_ASSISTANT, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "draft" });
  return { ...state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
async function structurize(state) {
  const trace = makeTraceCtx3(state);
  logAgentEvent(trace, "structurize_start");
  try {
    const model = getModel(AI_MODELS.POWERFUL, { temperature: 0.1 });
    const rawNote = state.raw_note || state.messages[state.messages.length - 1]?.content || "";
    const response = await model.invoke([
      new import_messages3.SystemMessage(DOCTOR_NOTE_SYSTEM_PROMPT),
      new import_messages3.HumanMessage(`Please structure the following clinical note into sections (Chief Complaint, History, Examination, Diagnosis, Plan, Follow-up). Mark your confidence as high/medium/low.

Raw note:
${rawNote}`)
    ]);
    const content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    const output = addMedicalDisclaimer({ type: "draft", content });
    logAgentEvent(trace, "structurize_complete");
    return { ...state, messages: [...state.messages, { role: "assistant", content }], final_output: output, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  } catch (err) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
function handleError3(state) {
  const msg = "I couldn't process the note right now. Please try again or write the note manually.";
  return { ...state, final_output: { type: "draft", content: msg, disclaimer: "Error occurred during processing." }, messages: [...state.messages, { role: "assistant", content: msg }] };
}

// ../../packages/ai/src/agents/doctor-note-assistant/graph.ts
async function runDoctorNoteGraph(initialState) {
  return runBoundedAgentGraph({
    name: "doctor-note-assistant",
    initialState,
    validateScope: validateScope3,
    run: structurize,
    handleError: handleError3
  });
}

// ../../packages/ai/src/agents/doctor-note-assistant/service.ts
init_src2();
async function invokeDoctorNoteAssistant(req) {
  const doctor = await prisma.doctor.findUnique({ where: { profileId: req.user_id } });
  if (!doctor) return { ok: false, error: "Doctor profile not found." };
  const baseState = createBaseState(req);
  const state = { ...baseState, doctor_id: doctor.id, raw_note: req.raw_note };
  const result = await runDoctorNoteGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type, disclaimer: result.final_output?.disclaimer },
    error: result.error
  };
}

// ../../packages/ai/src/agents/reminder-agent/nodes.ts
var import_messages4 = require("@langchain/core/messages");

// ../../packages/ai/src/agents/reminder-agent/prompts.ts
var REMINDER_AGENT_SYSTEM_PROMPT = `You are a notification drafting assistant for a clinic. You generate personalized, safe reminder messages for patients.

ROLE: Admin-facing notification message drafter.

ALLOWED ACTIONS:
- Draft booking confirmation messages
- Draft appointment reminder messages
- Draft delay/reschedule/cancellation notices
- Generate variants for email, SMS, and WhatsApp
- Adjust tone (formal, friendly, urgent)

NEVER DO:
- Send messages directly \u2014 you only draft, the notification service sends
- Include patient medical details in notifications
- Make promises about appointment outcomes
- Draft messages with misleading urgency`;

// ../../packages/ai/src/agents/reminder-agent/tools.ts
var import_tools5 = require("@langchain/core/tools");
var import_zod6 = require("zod");

// ../../packages/ai/src/integration/notification-hooks.ts
function draftNotificationTemplate(input) {
  const { type, patient_name, doctor_name, clinic_name, appointment_date, appointment_time, token_no, channel, tone } = input;
  const greeting = tone === "formal" ? `Dear ${patient_name},` : tone === "urgent" ? `Hi ${patient_name} \u2014 important update:` : `Hey ${patient_name}! \u{1F44B}`;
  let body = "";
  let subject = "";
  switch (type) {
    case "booking_confirmation":
      subject = `Appointment Confirmed \u2014 ${clinic_name}`;
      body = `${greeting}

Your appointment with Dr. ${doctor_name} is confirmed.
\u{1F4C5} Date: ${appointment_date}
\u{1F550} Time: ${appointment_time}${token_no ? `
\u{1F3AB} Token: T-${token_no}` : ""}

Please arrive 10 minutes early.`;
      break;
    case "reminder":
      subject = `Appointment Reminder \u2014 ${clinic_name}`;
      body = `${greeting}

This is a reminder for your upcoming appointment with Dr. ${doctor_name}.
\u{1F4C5} ${appointment_date} at ${appointment_time}${token_no ? `
\u{1F3AB} Token: T-${token_no}` : ""}

See you soon!`;
      break;
    case "delay":
      subject = `Delay Notice \u2014 ${clinic_name}`;
      body = `${greeting}

We're experiencing some delays at ${clinic_name}. Dr. ${doctor_name}'s schedule is running behind.

We apologize for the inconvenience and will update you shortly.`;
      break;
    case "reschedule":
      subject = `Appointment Rescheduled \u2014 ${clinic_name}`;
      body = `${greeting}

Your appointment with Dr. ${doctor_name} has been rescheduled.
\u{1F4C5} New date: ${appointment_date}
\u{1F550} New time: ${appointment_time}

Please contact us if this doesn't work for you.`;
      break;
    case "cancellation":
      subject = `Appointment Cancelled \u2014 ${clinic_name}`;
      body = `${greeting}

Your appointment with Dr. ${doctor_name} on ${appointment_date} has been cancelled.

Please book a new appointment when you're ready.`;
      break;
  }
  if (channel === "sms" || channel === "whatsapp") {
    return { channel, body: body.replace(/\n\n/g, "\n"), is_ai_draft: true };
  }
  return { channel, subject, body, is_ai_draft: true };
}

// ../../packages/ai/src/agents/reminder-agent/tools.ts
var draftNotificationTool = (0, import_tools5.tool)(
  async (input) => {
    const result = draftNotificationTemplate(input);
    return JSON.stringify(result);
  },
  {
    name: "draft_notification",
    description: "Draft a notification message using a template. Returns a structured message ready for review.",
    schema: import_zod6.z.object({
      type: import_zod6.z.enum(["booking_confirmation", "reminder", "delay", "reschedule", "cancellation"]),
      patient_name: import_zod6.z.string(),
      doctor_name: import_zod6.z.string(),
      clinic_name: import_zod6.z.string(),
      appointment_date: import_zod6.z.string(),
      appointment_time: import_zod6.z.string(),
      token_no: import_zod6.z.number().nullable().optional(),
      channel: import_zod6.z.enum(["email", "sms", "whatsapp"]),
      tone: import_zod6.z.enum(["formal", "friendly", "urgent"])
    })
  }
);
var reminderAgentTools = [draftNotificationTool];

// ../../packages/ai/src/agents/reminder-agent/nodes.ts
function makeTraceCtx4(state) {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.REMINDER_AGENT, user_id: state.user_id, clinic_id: state.clinic_id };
}
function validateScope4(state) {
  enforcePolicy({ agent_name: AGENT_NAMES.REMINDER_AGENT, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "draft" });
  return { ...state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
async function reason3(state) {
  const trace = makeTraceCtx4(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const modelWithTools = model.bindTools(reminderAgentTools);
    const messages = [
      new import_messages4.SystemMessage(REMINDER_AGENT_SYSTEM_PROMPT),
      ...state.messages.map((m) => m.role === "user" ? new import_messages4.HumanMessage(m.content) : new import_messages4.AIMessage(m.content))
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    if (response.tool_calls?.length) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matched = reminderAgentTools.find((t) => t.name === tc.name);
        if (matched) {
          try {
            toolResults.push({ tool: tc.name, result: await matched.invoke(tc.args) });
          } catch (e) {
            toolResults.push({ tool: tc.name, result: null, error: e.message });
          }
        }
      }
      const toolMsgs = toolResults.map((tr) => new import_messages4.HumanMessage(`Tool '${tr.tool}': ${JSON.stringify(tr.result)}`));
      const final = await model.invoke([...messages, new import_messages4.AIMessage(responseContent), ...toolMsgs]);
      const finalContent = typeof final.content === "string" ? final.content : JSON.stringify(final.content);
      return { ...state, messages: [...state.messages, { role: "assistant", content: finalContent }], tool_results: toolResults, final_output: { type: "draft", content: finalContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    return { ...state, messages: [...state.messages, { role: "assistant", content: responseContent }], final_output: { type: "draft", content: responseContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  } catch (err) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
function handleError4(state) {
  const msg = "I couldn't draft the notification right now. Please try again.";
  return { ...state, final_output: { type: "draft", content: msg }, messages: [...state.messages, { role: "assistant", content: msg }] };
}

// ../../packages/ai/src/agents/reminder-agent/graph.ts
async function runReminderGraph(initialState) {
  return runBoundedAgentGraph({
    name: "reminder-agent",
    initialState,
    validateScope: validateScope4,
    run: reason3,
    handleError: handleError4
  });
}

// ../../packages/ai/src/agents/reminder-agent/service.ts
async function invokeReminderAgent(req) {
  const baseState = createBaseState(req);
  const state = { ...baseState };
  const result = await runReminderGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error
  };
}

// ../../packages/ai/src/agents/admin-insights/nodes.ts
var import_messages5 = require("@langchain/core/messages");

// ../../packages/ai/src/agents/admin-insights/prompts.ts
var ADMIN_INSIGHTS_SYSTEM_PROMPT = `You are an operational analytics assistant for a clinic administrator. You help admins understand booking trends, no-show patterns, and schedule optimization opportunities.

ROLE: Admin-facing read-only analytics assistant.

ALLOWED ACTIONS:
- Summarize booking trends (daily, weekly, monthly)
- Analyze no-show patterns
- Suggest schedule optimization ideas
- Answer natural language questions about operational metrics
- Compare doctor utilization rates

NEVER DO:
- Modify any data (appointments, users, schedules)
- Delete records
- Access individual patient medical records
- Make clinical recommendations
- Reveal individual patient contact details in analytics

BEHAVIOR:
- Be data-driven and precise
- Always cite the data source (which tool you used)
- Tools are already scoped to the authenticated clinic; do not request or invent clinic_id values
- Present numbers clearly with context
- Suggest actionable improvements based on patterns`;

// ../../packages/ai/src/agents/admin-insights/tools.ts
var import_tools7 = require("@langchain/core/tools");
var import_zod7 = require("zod");
init_src2();
function createAdminInsightsTools(ctx) {
  const getAppointmentStatsTool = (0, import_tools7.tool)(
    async (input) => {
      const days = input.days || 30;
      const since = /* @__PURE__ */ new Date();
      since.setDate(since.getDate() - days);
      const [total, completed, noShow, cancelled] = await Promise.all([
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "completed", createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "no_show", createdAt: { gte: since } } }),
        prisma.appointment.count({ where: { clinicId: ctx.clinic_id, status: "cancelled", createdAt: { gte: since } } })
      ]);
      return JSON.stringify({
        period_days: days,
        total_appointments: total,
        completed,
        no_shows: noShow,
        no_show_rate: total > 0 ? `${(noShow / total * 100).toFixed(1)}%` : "0%",
        cancellations: cancelled,
        cancellation_rate: total > 0 ? `${(cancelled / total * 100).toFixed(1)}%` : "0%",
        completion_rate: total > 0 ? `${(completed / total * 100).toFixed(1)}%` : "0%"
      });
    },
    {
      name: "get_appointment_stats",
      description: "Get appointment statistics for the authenticated clinic over a period.",
      schema: import_zod7.z.object({
        days: import_zod7.z.number().nullable().optional().describe("Number of days to look back (default 30)")
      })
    }
  );
  const getDoctorUtilizationTool = (0, import_tools7.tool)(
    async () => {
      const doctors = await prisma.doctor.findMany({
        where: { clinicId: ctx.clinic_id, deletedAt: null },
        include: {
          profile: { select: { name: true } },
          appointments: { where: { createdAt: { gte: new Date(Date.now() - 30 * 864e5) } } }
        }
      });
      return JSON.stringify(doctors.map((d) => ({
        doctor_name: d.profile?.name ?? "Unknown",
        total_appointments: d.appointments.length,
        completed: d.appointments.filter((a) => a.status === "completed").length,
        no_shows: d.appointments.filter((a) => a.status === "no_show").length
      })));
    },
    {
      name: "get_doctor_utilization",
      description: "Get utilization metrics for each doctor in the authenticated clinic.",
      schema: import_zod7.z.object({})
    }
  );
  const getPatientCountTool = (0, import_tools7.tool)(
    async () => {
      const total = await prisma.patient.count({
        where: {
          appointments: {
            some: { clinicId: ctx.clinic_id }
          }
        }
      });
      return JSON.stringify({
        total_patients_with_clinic_appointments: total
      });
    },
    {
      name: "get_patient_count",
      description: "Get the number of patients who have appointments in the authenticated clinic.",
      schema: import_zod7.z.object({})
    }
  );
  return [getAppointmentStatsTool, getDoctorUtilizationTool, getPatientCountTool];
}

// ../../packages/ai/src/agents/admin-insights/nodes.ts
function makeTraceCtx5(state) {
  return { request_id: state.request_id, thread_id: state.thread_id, agent_name: AGENT_NAMES.ADMIN_INSIGHTS, user_id: state.user_id, clinic_id: state.clinic_id };
}
function validateScope5(state) {
  enforcePolicy({ agent_name: AGENT_NAMES.ADMIN_INSIGHTS, user_role: state.role, user_id: state.user_id, clinic_id: state.clinic_id, action: "read" });
  return { ...state, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
}
async function reason4(state) {
  const trace = makeTraceCtx5(state);
  logAgentEvent(trace, "reason_start");
  try {
    const model = getModel();
    const adminInsightsTools = createAdminInsightsTools({ clinic_id: state.clinic_id });
    const modelWithTools = model.bindTools(adminInsightsTools);
    const messages = [
      new import_messages5.SystemMessage(ADMIN_INSIGHTS_SYSTEM_PROMPT + `
Context: clinic_id=${state.clinic_id}`),
      ...state.messages.map((m) => m.role === "user" ? new import_messages5.HumanMessage(m.content) : new import_messages5.AIMessage(m.content))
    ];
    const response = await modelWithTools.invoke(messages);
    const responseContent = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    if (response.tool_calls?.length) {
      const toolResults = [];
      for (const tc of response.tool_calls) {
        const matched = adminInsightsTools.find((t) => t.name === tc.name);
        if (matched) {
          try {
            toolResults.push({ tool: tc.name, result: await matched.invoke(tc.args) });
          } catch (e) {
            toolResults.push({ tool: tc.name, result: null, error: e.message });
          }
        }
      }
      const toolMsgs = toolResults.map((tr) => new import_messages5.HumanMessage(`Tool '${tr.tool}': ${JSON.stringify(tr.result)}`));
      const final = await model.invoke([...messages, new import_messages5.AIMessage(responseContent), ...toolMsgs]);
      const finalContent = typeof final.content === "string" ? final.content : JSON.stringify(final.content);
      return { ...state, messages: [...state.messages, { role: "assistant", content: finalContent }], tool_results: toolResults, final_output: { type: "prediction", content: finalContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
    }
    return { ...state, messages: [...state.messages, { role: "assistant", content: responseContent }], final_output: { type: "prediction", content: responseContent }, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  } catch (err) {
    logAgentError(trace, err);
    return { ...state, error: err.message, updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  }
}
function handleError5(state) {
  const msg = "I couldn't retrieve the analytics data right now. Please try again.";
  return { ...state, final_output: { type: "prediction", content: msg }, messages: [...state.messages, { role: "assistant", content: msg }] };
}

// ../../packages/ai/src/agents/admin-insights/graph.ts
async function runAdminInsightsGraph(initialState) {
  return runBoundedAgentGraph({
    name: "admin-insights",
    initialState,
    validateScope: validateScope5,
    run: reason4,
    handleError: handleError5
  });
}

// ../../packages/ai/src/agents/admin-insights/service.ts
async function invokeAdminInsights(req) {
  const baseState = createBaseState(req);
  const state = { ...baseState };
  const result = await runAdminInsightsGraph(state);
  return {
    ok: !result.error,
    data: { thread_id: result.thread_id, response: result.final_output?.content, type: result.final_output?.type },
    error: result.error
  };
}

// src/modules/ai/ai.controller.ts
async function resolveClinicId(userId, role) {
  if (role === "doctor") {
    const doc = await prisma.doctor.findUnique({ where: { profileId: userId } });
    return doc?.clinicId || null;
  }
  if (role === "patient") {
    const patient = await prisma.patient.findUnique({ where: { profileId: userId } });
    if (!patient) return null;
    const appt = await prisma.appointment.findFirst({ where: { patientId: patient.id }, select: { clinicId: true } });
    if (appt) return appt.clinicId;
    const clinic = await prisma.clinic.findFirst();
    return clinic?.id || null;
  }
  if (role === "admin") {
    const clinic = await prisma.clinic.findFirst();
    return clinic?.id || null;
  }
  return null;
}
function guardAIConfigured(res) {
  if (!isAIConfigured()) {
    res.status(503).json({ ok: false, error: "AI service is not configured. Set GROQ_API_KEY in .env." });
    return false;
  }
  return true;
}
async function patientAssistant(req, res, next) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user.id, req.user.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });
    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message,
      thread_id: req.body.thread_id,
      appointment_id: req.body.appointment_id
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const result = await invokeAppointmentAssistant(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
async function queueAssistant(req, res, next) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user.id, req.user.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });
    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message,
      thread_id: req.body.thread_id
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const result = await invokeQueueIntelligence(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
async function doctorNoteAssistant(req, res, next) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user.id, req.user.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });
    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message || req.body.raw_note,
      thread_id: req.body.thread_id,
      appointment_id: req.body.appointment_id
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const result = await invokeDoctorNoteAssistant({ ...parsed.data, raw_note: req.body.raw_note });
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
async function adminInsightsAssistant(req, res, next) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user.id, req.user.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });
    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message,
      thread_id: req.body.thread_id
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const result = await invokeAdminInsights(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}
async function reminderPreview(req, res, next) {
  try {
    if (!guardAIConfigured(res)) return;
    const clinicId = await resolveClinicId(req.user.id, req.user.role);
    if (!clinicId) return res.status(400).json({ ok: false, error: "Could not resolve clinic context." });
    const parsed = AgentRequestSchema.safeParse({
      clinic_id: clinicId,
      user_id: req.user.id,
      role: req.user.role,
      message: req.body.message,
      thread_id: req.body.thread_id
    });
    if (!parsed.success) return res.status(400).json({ ok: false, error: parsed.error.message });
    const result = await invokeReminderAgent(parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
}

// src/modules/ai/ai.router.ts
var aiRouter = (0, import_express8.Router)();
aiRouter.use(requireAuth);
aiRouter.post("/assistant/patient", requireRole(["patient"]), patientAssistant);
aiRouter.post("/assistant/queue", queueAssistant);
aiRouter.post("/assistant/doctor-note", requireRole(["doctor"]), doctorNoteAssistant);
aiRouter.post("/assistant/admin-insights", requireRole(["admin"]), adminInsightsAssistant);
aiRouter.post("/assistant/reminder-preview", requireRole(["admin"]), reminderPreview);

// src/middleware/rate-limit.ts
var windowMs = 15 * 60 * 1e3;
var maxRequests = 100;
var store = /* @__PURE__ */ new Map();
function rateLimiter(limit = maxRequests) {
  return (req, res, next) => {
    if (process.env.NODE_ENV !== "production") {
      return next();
    }
    const key = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt < now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (entry.count >= limit) {
      return res.status(429).json({
        ok: false,
        error: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((entry.resetAt - now) / 1e3)
      });
    }
    entry.count++;
    return next();
  };
}
var authRateLimiter = rateLimiter(10);
var apiRateLimiter = rateLimiter(100);

// src/index.ts
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), ".env") });
import_dotenv.default.config({ path: import_path.default.resolve(process.cwd(), "../../.env") });
var logger3 = createLogger("express-api");
var app = (0, import_express9.default)();
var httpServer = (0, import_http.createServer)(app);
app.use((0, import_helmet.default)());
app.use(
  (0, import_cors.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "http://localhost:3000",
    credentials: true
  })
);
app.use(import_express9.default.json());
app.get("/api/health", (_req, res) => res.json({ ok: true, status: "healthy", ts: (/* @__PURE__ */ new Date()).toISOString() }));
app.use("/api/auth", authRateLimiter, router);
app.use("/api/patient", apiRateLimiter, router2);
app.use("/api/queue", router3);
app.use("/api/appointments", apiRateLimiter, router4);
app.use("/api/admin", apiRateLimiter, router5);
app.use("/api/doctor", apiRateLimiter, router6);
app.use("/api/doctors", apiRateLimiter, doctorsPublicRouter);
app.use("/api/ai", apiRateLimiter, aiRouter);
app.use(errorHandler);
initSockets(httpServer);
var PORT = process.env.PORT || 4e3;
httpServer.listen(PORT, () => {
  logger3.info(`Express API Server running on port ${PORT}`);
});
