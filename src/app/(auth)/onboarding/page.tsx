// src/app/(auth)/onboarding/page.tsx - Updated with Bags.Fi styling

"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentStep, setCurrentStep] = useState(0)
  const [username, setUsername] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)

  const walletAddress = searchParams.get("wallet")

  const STEPS = [
    {
      title: "Choose Your Handle",
      description: "Pick a unique username that represents you in the community.",
      hint: "Your handle is permanent and linked to your wallet.",
      icon: "👤",
      type: "input",
    },
    {
      title: "Your Bags Matter Here",
      description: "Your token holdings determine your access level and community tier.",
      bullets: [
        "Every token you hold unlocks exclusive content and channels",
        "Higher holdings = deeper access and influence",
        "Your portfolio is your membership card",
      ],
      icon: "💰",
      type: "info",
    },
    {
      title: "Communities Are Token-Native",
      description: "Join or create communities centered around specific tokens.",
      bullets: [
        "Discover communities built around your favorite tokens",
        "Each community has its own governance and rules",
        "Token-based entry tiers create natural incentives",
      ],
      icon: "👥",
      type: "info",
    },
    {
      title: "Influence Through Engagement",
      description: "Build your reputation and rise through the leaderboards.",
      bullets: [
        "Global rankings track top holders and influencers",
        "Community-specific leaderboards show local power players",
        "Your influence affects your visibility and reach",
      ],
      icon: "🏆",
      type: "info",
    },
    {
      title: "Real-Time Verification",
      description: "Your holdings are verified instantly on-chain via Bags API.",
      bullets: [
        "No centralized intermediary - just blockchain",
        "Access updates instantly as your holdings change",
        "Complete transparency and security",
      ],
      icon: "✓",
      type: "info",
    },
    {
      title: "Welcome to InnerCircle",
      description: "You're all set! Get ready to unlock your community and build influence.",
      bullets: [
        "Your wallet is your identity",
        "Your bags define your access",
        "Your engagement builds your influence",
      ],
      icon: "⚡️",
      type: "final",
    },
  ]

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1)
    } else {
      completeOnboarding()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const completeOnboarding = async () => {
    setIsCompleting(true)
    // Simulate API call
    setTimeout(() => {
      router.push("/")
      setIsCompleting(false)
    }, 1000)
  }

  const step = STEPS[currentStep]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e27] via-[#0f1229] to-[#0a0e27] flex items-center justify-center px-6 py-12">
      {/* Background effects */}
      <motion.div
        className="absolute top-0 right-0 w-96 h-96 bg-[#7c3aed] rounded-full filter blur-3xl opacity-10"
        animate={{ y: [0, 30, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 left-0 w-96 h-96 bg-[#00ff88] rounded-full filter blur-3xl opacity-10"
        animate={{ y: [0, -30, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
      />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Progress indicator */}
        <motion.div
          className="flex gap-2 justify-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {STEPS.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx <= currentStep ? "bg-gradient-to-r from-[#00ff88] to-[#00d9ff]" : "bg-[rgba(0,255,136,0.1)]"
              }`}
              animate={{ width: idx <= currentStep ? 32 : 8 }}
            />
          ))}
        </motion.div>

        {/* Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 30, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -30, rotateX: -20 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0f1229]/80 backdrop-blur-xl border border-[rgba(0,255,136,0.2)] rounded-3xl p-12 mb-8"
        >
          <div className="text-center">
            {/* Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-7xl mb-6 inline-block"
            >
              {step.icon}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-4xl font-bold mb-4"
            >
              {step.title}
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-xl text-gray-300 mb-8 leading-relaxed"
            >
              {step.description}
            </motion.p>

            {/* Input field */}
            {step.type === "input" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mb-6"
              >
                <input
                  type="text"
                  placeholder="your_handle"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                  className="w-full px-6 py-4 text-center text-2xl font-bold bg-[#1a1f3a] border border-[rgba(0,255,136,0.2)] rounded-xl text-[#00ff88] placeholder-gray-500 focus:outline-none focus:border-[#00ff88] focus:shadow-[0_0_20px_rgba(0,255,136,0.3)] transition-all"
                  autoFocus
                />
                <p className="text-sm text-gray-400 mt-3">{step.hint}</p>
              </motion.div>
            )}

            {/* Bullets */}
            {step.bullets && (
              <motion.ul
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-left space-y-3 mb-8"
              >
                {step.bullets.map((bullet, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex gap-3 p-4 bg-[rgba(0,255,136,0.05)] border border-[rgba(0,255,136,0.1)] rounded-lg text-gray-300"
                  >
                    <span className="text-[#00ff88] font-bold">✓</span>
                    {bullet}
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 justify-between"
        >
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-3 border border-[rgba(0,255,136,0.2)] text-gray-300 rounded-full hover:border-[#00ff88] hover:text-[#00ff88] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Back
          </button>

          <div className="flex gap-4">
            {currentStep < STEPS.length - 1 && (
              <button onClick={handleSkip} className="px-6 py-3 text-gray-400 hover:text-[#00ff88] transition-all">
                Skip
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={currentStep === 0 && !username.trim()}
              className="px-8 py-3 bg-gradient-to-r from-[#00ff88] to-[#00d9ff] text-[#0a0e27] rounded-full font-bold hover:shadow-[0_0_20px_rgba(0,255,136,0.5)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {currentStep === STEPS.length - 1 ? "Complete" : "Next"}
            </button>
          </div>
        </motion.div>

        {/* Step indicator text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center mt-8 text-gray-500 text-sm"
        >
          Step {currentStep + 1} of {STEPS.length}
        </motion.div>
      </div>
    </div>
  )
}