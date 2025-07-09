"use client"

import type React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserPlus, Zap, Target, TrendingUp, CheckCircle, X, Mail, Lock } from "lucide-react"
import { useState } from "react"
import { useAuth } from "@/stores/hooks/useAuth"
import { useRouter } from "next/navigation"

function BackgroundGlow() {
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

export default function LoginPage() {
  const router = useRouter()
  const [showSignup, setShowSignup] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState("")
  const { signUp, signIn } = useAuth()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await signUp(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        // Check if email confirmation is required
        if (data.user && !data.session) {
          setError("Please check your email to confirm your account")
        } else {
          setIsRedirecting(true)
          router.push("/") // Redirect to main app
        }
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setError("")

    try {
      const { data, error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
      } else {
        setIsRedirecting(true)
        router.push("/") // Redirect to main app
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTryIt = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen bg-black relative text-white">
      <BackgroundGlow />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center min-h-screen relative px-8"
      >
        {/* Top Navigation */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="absolute top-8 right-8 z-20"
        >
          <Button
            onClick={() => {
              setShowLogin(true)
              setEmail("")
              setPassword("")
              setError("")
            }}
            variant="ghost"
            className="border border-white/20 text-white hover:bg-white/10 hover:text-white bg-transparent px-6 py-2 text-sm rounded-xl transition-all duration-300"
          >
            <Mail className="mr-2 h-4 w-4" />
            Sign In
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-center z-10 max-w-4xl"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mb-8"
          >
            <h1 className="text-6xl font-bold bg-gradient-to-r from-[#00FFAA] to-[#00CC88] bg-clip-text text-transparent mb-4">
              Passr
            </h1>
            <p className="text-gray-300 text-xl mb-2">AI-Powered Resume Optimization</p>
            <p className="text-gray-400 text-lg">Get your resume past ATS systems with 90+ compatibility scores</p>
          </motion.div>

          {/* Features Grid */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          >
            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all duration-300">
              <Target className="w-8 h-8 text-[#00FFAA] mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">ATS Optimization</h3>
              <p className="text-gray-400 text-sm">
                Advanced keyword matching and formatting for maximum ATS compatibility
              </p>
            </div>

            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all duration-300">
              <Zap className="w-8 h-8 text-[#00FFAA] mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-gray-400 text-sm">
                Smart content optimization using advanced machine learning algorithms
              </p>
            </div>

            <div className="bg-white/3 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/5 transition-all duration-300">
              <TrendingUp className="w-8 h-8 text-[#00FFAA] mb-4 mx-auto" />
              <h3 className="text-white font-semibold mb-2">90+ ATS Score</h3>
              <p className="text-gray-400 text-sm">
                Achieve industry-leading ATS compatibility scores for better job prospects
              </p>
            </div>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mb-12"
          >
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                <CheckCircle className="w-4 h-4 text-[#00FFAA]" />
                <span className="text-gray-300">Instant Analysis</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                <CheckCircle className="w-4 h-4 text-[#00FFAA]" />
                <span className="text-gray-300">Keyword Optimization</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                <CheckCircle className="w-4 h-4 text-[#00FFAA]" />
                <span className="text-gray-300">Format Enhancement</span>
              </div>
              <div className="flex items-center space-x-2 bg-[#00FFAA]/10 border border-[#00FFAA]/30 rounded-full px-4 py-2">
                <CheckCircle className="w-4 h-4 text-[#00FFAA]" />
                <span className="text-gray-300">Industry Metrics</span>
              </div>
            </div>
          </motion.div>

          {/* Action Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            className="flex justify-center"
          >
            <Button
              onClick={() => {
                setShowSignup(true)
                setEmail("")
                setPassword("")
                setError("")
              }}
              className="bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(0,255,170,0.4)] shadow-[0_0_20px_rgba(0,255,170,0.2)]"
            >
              <UserPlus className="mr-3 h-5 w-5" />
              Create Account
            </Button>
          </motion.div>
        </motion.div>

        {/* Signup Modal */}
        {showSignup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowSignup(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Create Account</h2>
                <Button
                  onClick={() => setShowSignup(false)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA]"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!email || !password || isLoading || isRedirecting}
                  className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading || isRedirecting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isRedirecting ? "Redirecting..." : isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setShowSignup(false)
                    setShowLogin(true)
                    setError("")
                  }}
                  className="text-gray-400 hover:text-[#00FFAA] text-sm transition-colors"
                >
                  Already have an account? Sign in
                </button>
              </div>

              <p className="text-gray-400 text-xs text-center mt-4">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
            </motion.div>
          </motion.div>
        )}

        {/* Login Modal */}
        {showLogin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowLogin(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                <Button
                  onClick={() => setShowLogin(false)}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-medium text-gray-300">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-[#00FFAA] focus:ring-[#00FFAA]"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!email || !password || isLoading || isRedirecting}
                  className="w-full bg-gradient-to-r from-[#00FFAA] to-[#00DD99] hover:from-[#00DD99] hover:to-[#00FFAA] text-black font-bold py-3 rounded-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
                >
                  {isLoading || isRedirecting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                      className="w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"
                    />
                  ) : (
                    <Mail className="mr-2 h-4 w-4" />
                  )}
                  {isRedirecting ? "Redirecting..." : isLoading ? "Signing In..." : "Sign In"}
                </Button>
              </form>

              <div className="text-center mt-4">
                <button
                  onClick={() => {
                    setShowLogin(false)
                    setShowSignup(true)
                    setError("")
                  }}
                  className="text-gray-400 hover:text-[#00FFAA] text-sm transition-colors"
                >
                  Don't have an account? Create one
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.footer
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          className="absolute bottom-8 left-0 right-0 text-center z-10"
        >
          <span className="text-gray-500 text-sm">Made by </span>
          <a
            href="https://khizarmalik.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-[#00FFAA] transition-colors duration-300 border-b border-gray-400 hover:border-[#00FFAA] pb-1 font-medium"
          >
            Khizar Malik
          </a>
        </motion.footer>
      </motion.div>
    </div>
  )
}