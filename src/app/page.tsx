"use client"

import { useState, useRef, useEffect } from "react"
import { motion, useScroll, useSpring, useMotionValue, useTransform, AnimatePresence } from "framer-motion"
import { Shield, Zap, Timer, Lock, ArrowRight, MousePointer2, ChevronDown } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { CreateRoomModal } from "@/components/CreateRoomModal"
import { JoinRoomModal } from "@/components/JoinRoomModal"
import { ThemeToggle } from "@/components/ThemeToggle"

// --- Custom Hooks & Logic ---

const useMouse = () => {
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const [isHovering, setIsHovering] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)

      // Interaction Check
      const target = e.target as HTMLElement
      const isInteractive =
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.getAttribute("role") === "button"

      setIsHovering(!!isInteractive)
    }

    const handleMouseDown = () => setIsClicking(true)
    const handleMouseUp = () => setIsClicking(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mousedown", handleMouseDown)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mousedown", handleMouseDown)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [mouseX, mouseY])

  return { mouseX, mouseY, isHovering, isClicking }
}

const CursorFollower = () => {
  const { mouseX, mouseY, isHovering, isClicking } = useMouse()

  // Smooth spring physics for laggy follower
  const smoothX = useSpring(mouseX, { damping: 40, stiffness: 300, mass: 0.8 })
  const smoothY = useSpring(mouseY, { damping: 40, stiffness: 300, mass: 0.8 })

  return (
    <>
      {/* Main Dot - Snappy & Vibrant */}
      <motion.div
        className="fixed top-0 left-0 w-3 h-3 bg-[var(--primary)] rounded-full pointer-events-none z-[9999] shadow-sm"
        style={{ x: mouseX, y: mouseY, translateX: "-50%", translateY: "-50%" }}
      />

      {/* Jelly Follower - Amorphous & Gradient */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998] opacity-60 blur-[1px]"
        style={{
          x: smoothX,
          y: smoothY,
          translateX: "-50%",
          translateY: "-50%",
          background: "linear-gradient(135deg, var(--primary), #8b5cf6)", // Primary to Purple
        }}
        animate={{
          width: isHovering ? 50 : 32,
          height: isHovering ? 50 : 32,
          scale: isClicking ? 0.8 : 1,
          // Morphing Border Radius
          borderRadius: isHovering
            ? ["40% 60% 70% 30% / 40% 50% 60% 50%", "60% 40% 30% 70% / 60% 50% 40% 50%", "40% 60% 70% 30% / 40% 50% 60% 50%"] // Faster/Tighter when active
            : ["30% 70% 70% 30% / 30% 30% 70% 70%", "70% 30% 30% 70% / 70% 70% 30% 30%", "30% 70% 70% 30% / 30% 30% 70% 70%"], // Lazy blob
          rotate: [0, 90, 180, 270, 360]
        }}
        transition={{
          // Morph transition
          borderRadius: {
            duration: 4,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "mirror"
          },
          // Rotate transition
          rotate: {
            duration: 8,
            ease: "linear",
            repeat: Infinity
          },
          // Size/Scale snap
          width: { type: "spring", stiffness: 300, damping: 20 },
          height: { type: "spring", stiffness: 300, damping: 20 },
          scale: { type: "spring", stiffness: 400, damping: 25 }
        }}
      />
    </>
  )
}

// --- Components ---

const FloatingOrbs = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-[var(--primary)] blur-[60px]"
          style={{
            width: Math.random() * 200 + 40,
            height: Math.random() * 200 + 40,
            opacity: 0.08,
          }}
          initial={{
            x: Math.random() * 100 + "vw",
            y: Math.random() * 100 + "vh",
          }}
          animate={{
            x: [
              null,
              Math.random() * 100 + "vw",
              Math.random() * 100 + "vw",
            ],
            y: [
              null,
              Math.random() * 100 + "vh",
              Math.random() * 100 + "vh",
            ],
          }}
          transition={{
            duration: Math.random() * 20 + 20,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  )
}

const FeatureCard = ({ icon: Icon, title, desc, delay }: { icon: any, title: string, desc: string, delay: number }) => (
  <motion.div
    initial={{ opacity: 0.3, filter: "blur(8px)", y: 60 }}
    whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ delay, duration: 0.8, ease: "easeOut" }}
    className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-[var(--primary)]/20"
  >
    <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--elevated)] text-[var(--primary)] transition-transform duration-500 group-hover:scale-110">
      <Icon className="h-6 w-6" />
    </div>
    <h3 className="mb-3 text-xl font-bold text-[var(--text)]">{title}</h3>
    <p className="text-[var(--text-muted)] leading-relaxed">{desc}</p>
  </motion.div>
)

const Step = ({ number, title, desc }: { number: string, title: string, desc: string }) => (
  <motion.div
    initial={{ opacity: 0.3, filter: "blur(8px)", y: 60 }}
    whileInView={{ opacity: 1, filter: "blur(0px)", y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    className="flex flex-col items-center text-center"
  >
    <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-xl font-bold font-mono text-[var(--text)] shadow-sm transition-transform hover:scale-110 duration-300">
      {number}
    </div>
    <h3 className="mb-2 text-lg font-bold text-[var(--text)]">{title}</h3>
    <p className="text-sm text-[var(--text-muted)]">{desc}</p>
  </motion.div>
)

// --- Main Page Component ---

import { Suspense } from "react"

const LandingPageContent = () => {
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)

  // Custom Hook Logic
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  })

  // Notification Logic
  const searchParams = useSearchParams()
  const [notification, setNotification] = useState<{ title: string, msg: string, type: 'success' | 'error' | 'alert' } | null>(null)

  useEffect(() => {
    const destroyed = searchParams.get("destroyed")
    const error = searchParams.get("error")

    if (destroyed) {
      setNotification({
        title: "Protocol Complete",
        msg: "Channel has been permanently incinerated. No traces remain.",
        type: "alert"
      })
      window.history.replaceState(null, "", "/")
    } else if (error === "room-not-found") {
      setNotification({
        title: "Connection Failed",
        msg: "Target frequency unreachable. Channel may have expired.",
        type: "error"
      })
      window.history.replaceState(null, "", "/")
    } else if (error === "room-full") {
      setNotification({
        title: "Access Denied",
        msg: "Channel capacity at maximum. Uplink rejected.",
        type: "error"
      })
      window.history.replaceState(null, "", "/")
    }

    if (destroyed || error) {
      const timer = setTimeout(() => setNotification(null), 6000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Parallax transforms
  const heroX = useTransform(mouseX, [-500, 500], [15, -15])
  const heroY = useTransform(mouseY, [-500, 500], [15, -15])
  const orbsX = useTransform(mouseX, [-500, 500], [-25, 25])
  const orbsY = useTransform(mouseY, [-500, 500], [-25, 25])

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e
    const { innerWidth, innerHeight } = window
    mouseX.set(clientX - innerWidth / 2)
    mouseY.set(clientY - innerHeight / 2)
  }

  return (
    <div
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--primary)] selection:text-[var(--bg)] transition-colors duration-500"
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[var(--primary)] origin-left z-50"
        style={{ scaleX }}
      />

      {/* Custom Cursor Follower */}
      <CursorFollower />

      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -50, x: "-50%" }}
            className="fixed top-8 left-1/2 z-[100] w-full max-w-md px-4 pointer-events-none"
          >
            <div className={`
              pointer-events-auto flex items-start gap-4 p-4 rounded-xl border backdrop-blur-md shadow-2xl
              ${notification.type === 'alert' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : ''}
              ${notification.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-500' : ''}
              ${notification.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : ''}
            `}>
              <div className={`
                p-2 rounded-lg shrink-0
                ${notification.type === 'alert' ? 'bg-amber-500/20' : ''}
                ${notification.type === 'error' ? 'bg-red-500/20' : ''}
                ${notification.type === 'success' ? 'bg-emerald-500/20' : ''}
              `}>
                {notification.type === 'alert' && <Shield className="h-5 w-5" />}
                {notification.type === 'error' && <Lock className="h-5 w-5" />}
                {notification.type === 'success' && <Zap className="h-5 w-5" />}
              </div>
              <div className="flex-1 pt-0.5">
                <h3 className="font-bold text-sm mb-1 uppercase tracking-wide">{notification.title}</h3>
                <p className="text-xs opacity-90 leading-relaxed">{notification.msg}</p>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="p-1 hover:bg-[var(--text)]/10 rounded transition-colors"
              >
                <div className="h-4 w-4 relative">
                  <div className="absolute inset-0 rotate-45 bg-current h-[1px] top-1/2" />
                  <div className="absolute inset-0 -rotate-45 bg-current h-[1px] top-1/2" />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ThemeToggle />
      <div className="fixed inset-0 grain-overlay z-[1] pointer-events-none mix-blend-overlay opacity-30" />

      <CreateRoomModal isOpen={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinRoomModal isOpen={joinOpen} onClose={() => setJoinOpen(false)} />

      {/* HERO */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-20 overflow-hidden z-[2]">
        <motion.div style={{ x: orbsX, y: orbsY }} className="absolute inset-0 z-0">
          <FloatingOrbs />
        </motion.div>

        <motion.div style={{ x: heroX, y: heroY }} className="z-10 flex flex-col items-center text-center max-w-5xl">
          <motion.h1
            initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)", y: 40 }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8 text-7xl font-bold tracking-tighter md:text-9xl text-gradient"
          >
            PINGME
          </motion.h1>

          <motion.div
            className="mb-8 flex flex-wrap justify-center gap-4 text-sm font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] animate-[pulse_3s_ease-in-out_infinite]"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.12 } }
            }}
          >
            {["Ephemeral.", "Secure.", "Private."].map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" }
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                {word}
              </motion.span>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mb-12 max-w-xl text-lg text-[var(--text-muted)] leading-relaxed"
          >
            Connect instantly in encrypted, self-destructing rooms. No data retained. No accounts required. Just pure, fleeting communication.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            {/* Primary Button */}
            <button
              onClick={() => setCreateOpen(true)}
              className="group relative flex items-center justify-center gap-2 rounded-full bg-[var(--primary)] px-8 py-4 font-bold text-[var(--bg)] overflow-hidden transition-transform hover:scale-105 active:scale-95"
            >
              <span className="absolute inset-0 w-full h-full bg-[var(--primary-hover)] scale-0 rounded-full transition-transform duration-400 ease-out group-hover:scale-150 origin-center" />
              <span className="relative z-10 flex items-center gap-2">
                CREATE ROOM <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Secondary Button */}
            <button
              onClick={() => setJoinOpen(true)}
              className="group relative flex items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-8 py-4 font-bold text-[var(--text)] backdrop-blur-sm transition-all hover:bg-[var(--elevated)] hover:border-[var(--primary)]/10 active:scale-95"
            >
              JOIN ROOM
            </button>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[var(--text-muted)] flex flex-col items-center gap-2 text-xs font-bold tracking-widest uppercase animate-bounce opacity-60"
        >
          <span>Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </section>

      {/* FEATURES */}
      <section className="py-32 px-4 bg-[var(--elevated)] border-y border-[var(--border)] z-[2] relative">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              delay={0}
              icon={Timer}
              title="Self-Destructing"
              desc="Rooms and messages are legally and technically wiped from existence after expiry. No logs, no backups."
            />
            <FeatureCard
              delay={0.2}
              icon={Shield}
              title="No Trace Left"
              desc="We don't ask for your email, phone, or name. Your identity is a temporary cryptographic token."
            />
            <FeatureCard
              delay={0.4}
              icon={Zap}
              title="Real-Time Sync"
              desc="Powered by Redis and WebSocket for sub-100ms latency. See messages as they are typed."
            />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-32 px-4 relative overflow-hidden z-[2]">
        <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent -translate-y-1/2 hidden md:block" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 relative z-10">
          <Step number="01" title="Create Room" desc="Generate specific secure link." />
          <Step number="02" title="Share Code" desc="Send the 6-digit key." />
          <Step number="03" title="Chat Securely" desc="Encrypted, fast, private." />
          <Step number="04" title="Auto-Delete" desc="Gone forever in 10 mins." />
        </div>
      </section>

      {/* DEMO / PREVIEW */}
      <section className="py-20 px-4 flex justify-center perspective-1000 overflow-hidden z-[2]">
        <motion.div
          initial={{ rotateX: 20, rotateY: -10, scale: 0.9, opacity: 0 }}
          whileInView={{ rotateX: 0, rotateY: 0, scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="relative w-full max-w-4xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl"
        >
          {/* Mock Browser Header */}
          <div className="flex items-center gap-2 mb-4 px-2 py-3 border-b border-[var(--border)]">
            <div className="h-3 w-3 rounded-full bg-red-500/20" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/20" />
            <div className="h-3 w-3 rounded-full bg-green-500/20" />
            <div className="ml-4 h-6 px-4 rounded-full bg-[var(--elevated)] w-64" />
          </div>

          {/* Mock Chat Content */}
          <div className="h-[400px] flex flex-col justify-end p-8 space-y-4 bg-[var(--bg)] rounded-b-xl overflow-hidden relative">
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="bg-red-500/10 text-red-500 px-2 py-1 rounded text-xs font-bold animate-pulse">09:58</div>
            </div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl rounded-bl-sm self-start max-w-[80%] text-[var(--text-muted)] text-sm shadow-sm"
            >
              Did you get the package?
            </motion.div>

            <motion.div
              initial={{ x: 20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 1.2 }}
              className="bg-[var(--primary)] p-4 rounded-2xl rounded-br-sm self-end max-w-[80%] text-[var(--bg)] text-sm shadow-sm"
            >
              Confirmed. Code is secure.
            </motion.div>

            <motion.div
              initial={{ x: -20, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              transition={{ delay: 2.2 }}
              className="bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl rounded-bl-sm self-start max-w-[80%] text-[var(--text-muted)] text-sm shadow-sm"
            >
              Destroying this channel in 10 seconds.
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* TECH STACK & PRIVACY */}
      <section className="py-32 px-4 bg-[var(--elevated)] text-center clip-path-slant z-[2]">
        <div className="max-w-4xl mx-auto mb-20">
          <h2 className="text-3xl font-bold mb-8 text-[var(--text)]">Built for Paranoia</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] transition-hover hover:-translate-y-1 duration-300">
              <Lock className="h-8 w-8 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Zero Knowledge</h3>
              <p className="text-[var(--text-muted)]">We do not store messages on persistent databases. They exist only in RAM (Redis) with a strict TTL.</p>
            </div>
            <div className="bg-[var(--surface)] p-8 rounded-2xl border border-[var(--border)] shadow-[var(--shadow)] transition-hover hover:-translate-y-1 duration-300">
              <MousePointer2 className="h-8 w-8 text-[var(--primary)] mb-4" />
              <h3 className="text-xl font-bold mb-2 text-[var(--text)]">Anonymous</h3>
              <p className="text-[var(--text-muted)]">No cookies (except session token), no trackers, no analytics. We don't want to know who you are.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-4 bg-[var(--surface)] border-t border-[var(--border)] text-center z-[2]">
        <h2 className="text-4xl md:text-6xl font-bold mb-8 uppercase tracking-tighter text-gradient">
          Start a <span className="underline decoration-[var(--primary)] decoration-2 underline-offset-4">Secret</span> Channel
        </h2>
        <button
          onClick={() => setCreateOpen(true)}
          className="inline-block bg-[var(--primary)] text-[var(--bg)] px-12 py-5 rounded-full font-bold text-xl hover:bg-[var(--primary-hover)] transition-colors shadow-lg hover:shadow-xl hover:-translate-y-1 transform duration-300"
        >
          LAUNCH NOW
        </button>
        <div className="mt-20 text-[var(--text-muted)] text-sm">
          © {new Date().getFullYear()} PingMe Inc. Ephemeral Communications.
        </div>
      </footer>
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={null}>
      <LandingPageContent />
    </Suspense>
  )
}