import { useEffect, useState, useRef, useCallback } from 'react'
import { links } from '@/config/links'
import { PRICING_TIERS, getCurrentPricingTier, getSliderPosition } from '@/utils/pricing'
import { PRICE_COMPARISONS } from '@/utils/priceComparisons'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

// Toast component
const Toast = ({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000)
    return () => clearTimeout(timer)
  }, [onClose]) // Only re-run if onClose changes

  return (
    <div 
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md px-6 py-3 rounded-full shadow-lg text-[#F5F0E8] font-medium text-center
        ${type === 'success' ? 'bg-[#00A651]' : 'bg-[#E94E1B]'}
        animate-in fade-in slide-in-from-bottom-4 duration-300`}
    >
      {message}
    </div>
  )
}

const testimonials = [
  {
    name: "Your Name Here",
    role: "Your Role",
    text: "These aren't real because we don't have any users yet... Maybe your testimonial will go here!",
    image: "/fm-logo.png"
  },
  {
    name: "Your Name Here",
    role: "Your Role",
    text: "These aren't real because we don't have any users yet... Maybe your testimonial will go here!",
    image: "/fm-logo.png"
  },
  {
    name: "Your Name Here",
    role: "Your Role",
    text: "These aren't real because we don't have any users yet... Maybe your testimonial will go here!",
    image: "/fm-logo.png"
  }
];

// This is our source of truth that will be updated by the fetch
let CURRENT_USER_COUNT = 23

// Server URL - always use production since we're using Railway
const SERVER_URL = 'https://fm-turbo-production.up.railway.app'

const AnimatedCounter = ({ end, duration = 1000, start = false }: { 
  end: number; 
  duration?: number; 
  start: boolean;
}) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return;
    
    const steps = 60
    const increment = end / steps
    const stepDuration = duration / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, stepDuration)

    return () => clearInterval(timer)
  }, [end, duration, start])

  return <span>{count}</span>
}

// Get the initial count from our server
async function getServerCount() {
  try {
    const response = await fetch(`${SERVER_URL}/api/user-count`)
    const data = await response.json()
    return data.count
  } catch (error) {
    console.error('Error fetching server count:', error)
    return null // Return null instead of fallback number
  }
}

async function getUserCount() {
  try {
    console.log('🔄 Fetching total user count from Supabase...')
    
    // First let's log all users to verify the data
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
    } else {
      console.log('📊 Current users in database:', users)
    }

    // Now get the count
    const { count, error } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Error fetching user count:', error)
      return 0
    }
    
    console.log('✅ Successfully fetched user count:', count)
    return count || 0
  } catch (error) {
    console.error('❌ Error in getUserCount:', error)
    return 0
  }
}

export default function Welcome() {
  const navigate = useNavigate()
  const [usersAtLaunch, setUsersAtLaunch] = useState<number>(10)
  const [isCountLoaded, setIsCountLoaded] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isPricingVisible, setIsPricingVisible] = useState(false)
  const pricingSliderRef = useRef<HTMLDivElement>(null)
  const topRef = useRef<HTMLDivElement>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [userCount, setUserCount] = useState(0)

  // Fetch the initial count from server
  useEffect(() => {
    const fetchInitialCount = async () => {
      const count = await getServerCount()
      if (count !== null) {
        setUsersAtLaunch(count)
        setIsCountLoaded(true)
      }
    }
    fetchInitialCount()
  }, [])

  useEffect(() => {
    const fetchUserCount = async () => {
      const count = await getUserCount()
      setUserCount(count)
    }

    fetchUserCount()
  }, [])

  // Create a stable onClose callback using useCallback
  const handleToastClose = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    // Initialize intersection observer for fade-in animations
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in')
        }
      })
    }, {
      threshold: 0.1
    })

    // Observe all animatable elements
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      fadeObserver.observe(el)
    })

    // Initialize intersection observer for pricing slider
    const pricingObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !isPricingVisible) {
          setIsPricingVisible(true)
        }
      })
    }, {
      threshold: 0.5
    })

    // Observe pricing slider
    if (pricingSliderRef.current) {
      pricingObserver.observe(pricingSliderRef.current)
    }

    // Testimonial rotation
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000) // Rotate every 4 seconds

    return () => {
      fadeObserver.disconnect()
      pricingObserver.disconnect()
      clearInterval(interval)
    }
  }, [isPricingVisible])

  return (
    <main className="min-h-screen bg-[#F5F0E8] overflow-x-hidden relative">
      {/* Hero Section - Beige */}
      <section className="min-h-screen flex flex-col items-center px-4 relative overflow-hidden bg-turbo-beige">
        {/* Turbo Logo */}
        <div className="absolute top-4 left-4">
          <img 
            src="/turbo-logo.png" 
            alt="Turbo Logo" 
            className="h-9 w-auto"
          />
        </div>

        <div className="w-full h-[20vh]" ref={topRef}></div>
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-turbo-black tracking-tight animate-on-scroll">
            Turbocharge Your Creative Business
          </h1>
          <p className="text-lg md:text-2xl mb-16 text-turbo-black/80 tracking-tight max-w-2xl mx-auto animate-on-scroll">
            Transform hours of business tasks into seconds. Built specifically for freelance creatives who want to focus on what they do best.
          </p>
          
          <div className="mb-8 animate-on-scroll">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-3 mb-2 sm:mb-0">
                <img 
                  src="/profile-pic-1.jpg" 
                  alt="Creator profile" 
                  className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover relative z-30"
                />
                <img 
                  src="/profile-pic-2.jpg" 
                  alt="Creator profile" 
                  className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover relative z-20"
                />
                <img 
                  src="/profile-pic-3.jpg" 
                  alt="Creator profile" 
                  className="w-10 h-10 rounded-full border-2 border-[#F5F0E8] object-cover relative z-10"
                />
              </div>
              <div className="text-sm sm:text-base font-medium text-black text-center sm:text-left ml-1">
                JOIN {userCount > 0 ? userCount.toLocaleString() : 'FELLOW'} CREATORS AUTOMATING THEIR WORKFLOWS
              </div>
            </div>
          </div>

          <div className="mb-12 animate-on-scroll">
            <button 
              onClick={() => navigate('/sign-up')}
              className="h-[48px] px-6 font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors whitespace-nowrap"
            >
              Get Started For Free
            </button>
          </div>
        </div>
      </section>

      {/* How it Works Section - Black */}
      <section className="py-24 px-4 bg-turbo-black text-turbo-beige">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
              How it Works
            </h2>
            <p className="text-xl mb-12 opacity-80 animate-on-scroll">
              Watch how Turbo transforms your creative workflow in seconds
            </p>
            <div className="bg-turbo-beige/10 rounded-xl p-8 backdrop-blur-sm">
              <div style={{ position: 'relative', paddingBottom: '64.90384615384616%', height: 0 }}>
                <iframe 
                  src="https://www.loom.com/embed/926952eeaa9e401ebf107fc35038bc44?sid=07b2b81e-a7a8-4d06-a554-304cc35f7de4" 
                  frameBorder="0" 
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="space-y-8">
              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Content Proposal</h3>
                    <p className="text-turbo-beige/80">Generate professional proposals in seconds, increasing your win rate and saving hours of writing time</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">💌</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Outreach Message</h3>
                    <p className="text-turbo-beige/80">Craft personalized outreach messages that get responses, turning cold leads into warm conversations</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Run of Show</h3>
                    <p className="text-turbo-beige/80">Create detailed production schedules instantly, keeping your crew organized and shoots running smoothly</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Production Budget</h3>
                    <p className="text-turbo-beige/80">Generate accurate budgets quickly, ensuring profitability while maintaining transparency with clients</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Contractor Brief</h3>
                    <p className="text-turbo-beige/80">Create clear, comprehensive briefs for your team, ensuring everyone knows their roles and deliverables</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-turbo-blue rounded-lg p-3">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Timeline from Transcript <span className="text-xs bg-turbo-yellow text-turbo-blue px-1.5 py-0.5 rounded ml-2">BETA</span></h3>
                    <p className="text-turbo-beige/80">Convert interview transcripts into organized timelines automatically, cutting post-production planning time in half</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose-Built Section - Beige */}
      <section className="py-24 px-4 bg-turbo-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-12 tracking-tight text-center text-turbo-black">
            Specifically Built for Freelance Creatives
          </h2>
          <div className="max-w-2xl mx-auto text-center mb-16">
            <p className="text-2xl md:text-3xl font-bold mb-4 text-turbo-blue">
              AI won't take your job. But someone using it will.
            </p>
            <p className="text-xl md:text-2xl text-turbo-black/80">
              Be the one using it... not the one being replaced by it.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-turbo-blue">
                  <th className="py-4 px-6 text-left text-turbo-blue font-medium">Feature</th>
                  <th className="py-4 px-6 text-center text-turbo-blue font-medium">Turbo</th>
                  <th className="py-4 px-6 text-center text-turbo-blue font-medium">ChatGPT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Pre-defined tasks that are relevant to your business</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✗</td>
                </tr>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Integrations with softwares you use (Vimeo, Dropbox, etc.)</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✗</td>
                </tr>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Custom prompts built for freelance creatives</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✗</td>
                </tr>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Created by nerds that are also creatives</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✗</td>
                </tr>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Aesthetic interface</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✗</td>
                </tr>
                <tr className="border-b border-turbo-blue/20">
                  <td className="py-4 px-6 text-turbo-blue">Built on OpenAI</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                  <td className="py-4 px-6 text-center text-turbo-blue">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Understanding Section */}
      <section className="py-24 px-4 bg-turbo-black text-turbo-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-7xl font-bold mb-12 tracking-tight text-center">
            We Understand Your Problems Because We Have Them Too
          </h2>
          <div className="space-y-8">
            <div className="flex items-start gap-6 p-6 rounded-lg bg-turbo-beige/5 hover:bg-turbo-beige/10 transition-colors">
              <div className="text-3xl text-turbo-blue">●</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-turbo-yellow">The Creative's Dilemma</h3>
                <p>You didn't become a creative to spend hours on proposals and budgets. Save that for the finance bros.</p>
              </div>
            </div>
            <div className="flex items-start gap-6 p-6 rounded-lg bg-turbo-beige/5 hover:bg-turbo-beige/10 transition-colors">
              <div className="text-3xl text-turbo-blue">●</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-turbo-yellow">The Time Trap</h3>
                <p>Every hour spent on admin is an hour not spent creating. Free up your time by automating repeatable tasks.</p>
              </div>
            </div>
            <div className="flex items-start gap-6 p-6 rounded-lg bg-turbo-beige/5 hover:bg-turbo-beige/10 transition-colors">
              <div className="text-3xl text-turbo-blue">●</div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-turbo-yellow">Generic AI Tools Suck</h3>
                <p>You've been using ChatGPT but it can't seem to make anything useful. They don't understand the nuances of creative work.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Yellow */}
      <section className="py-24 px-4 bg-turbo-blue text-turbo-beige">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-16 tracking-tight text-center">
            What Creators Are Saying
          </h2>
          <div className="max-w-xl mx-auto">
            <div className="relative min-h-[300px]">
              {testimonials.map((testimonial, index) => {
                return (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 transform ${
                      index === activeTestimonial 
                        ? 'translate-x-0 opacity-100 pointer-events-auto' 
                        : index < activeTestimonial 
                          ? '-translate-x-full opacity-0 pointer-events-none' 
                          : 'translate-x-full opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="bg-[#F5F0E8] rounded-lg p-8 h-full flex flex-col items-center justify-center text-black">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-16 h-auto object-contain mb-4"
                      />
                      <p className="text-lg mb-4 italic text-black/80">"{testimonial.text}"</p>
                      <div className="mt-auto">
                        <p className="font-semibold text-lg text-black">{testimonial.name}</p>
                        <p className="text-black/60">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              {testimonials.map((_, index) => {
                return (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === activeTestimonial
                        ? 'bg-[#F5F0E8] w-4'
                        : 'bg-[#F5F0E8]/30'
                    } mx-1`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - Now Black */}
      <section className="py-12 sm:py-24 px-4 bg-turbo-black text-turbo-beige">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr,400px] gap-8">
            {/* Left Column - Beta Info */}
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-7xl font-bold mb-6 text-turbo-beige tracking-tight">
                Join the Beta
              </h2>
              <p className="text-lg sm:text-xl mb-8 text-turbo-beige/80">
                Be one of the first to try Turbo and help shape its future.
              </p>
              <p className="text-base sm:text-lg mb-12 text-turbo-beige/80">
                Early beta users will get special perks and pricing when we launch.
              </p>

              <div className="bg-turbo-beige/5 rounded-xl p-4 mb-12 inline-block hover:bg-turbo-beige/10 transition-colors">
                <div className="text-base sm:text-lg font-medium text-turbo-beige flex items-center gap-2">
                  Users: <AnimatedCounter 
                    end={usersAtLaunch || 10} 
                    duration={1000} 
                    start={isCountLoaded && isPricingVisible}
                  />
                </div>
              </div>

              <div className="relative max-w-2xl mx-auto md:mx-0" ref={pricingSliderRef}>
                <div className="h-1 bg-turbo-beige/20 rounded-full mb-8">
                  <div 
                    className="absolute -top-2 w-4 h-4 bg-turbo-blue rounded-full transition-all duration-1000 -translate-x-1/2" 
                    style={{ 
                      left: isPricingVisible && isCountLoaded ? `${getSliderPosition(usersAtLaunch || 10)}%` : '0%',
                    }}
                  />
                </div>
                <div className="flex justify-between text-turbo-beige">
                  {PRICING_TIERS.map((tier, index) => (
                    <div 
                      key={index} 
                      className={`${getCurrentPricingTier(CURRENT_USER_COUNT) === tier ? 'opacity-100' : 'opacity-60'}`}
                      style={{
                        position: 'absolute',
                        left: `${tier.position}%`,
                        transform: 'translateX(-50%)',
                        width: 'max-content'
                      }}
                    >
                      <div className="text-xl sm:text-2xl font-bold whitespace-nowrap">
                        {typeof tier.price === 'number' ? (
                          <>
                            ${tier.price}<span className="text-base sm:text-lg font-normal">/mo</span>
                          </>
                        ) : (
                          tier.price
                        )}
                      </div>
                      <div className="text-xs sm:text-sm whitespace-nowrap">{tier.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Beta Signup Card */}
            <div className="md:sticky md:top-8 mt-16 md:mt-0">
              <div className="bg-turbo-beige rounded-xl p-6 sm:p-8 shadow-lg">
                <h3 className="text-xl sm:text-2xl font-bold mb-4 text-turbo-black">Beta Access</h3>
                <div className="text-4xl sm:text-6xl font-bold text-turbo-blue mb-8">
                  {typeof getCurrentPricingTier(CURRENT_USER_COUNT).price === 'number' ? (
                    <>
                      ${getCurrentPricingTier(CURRENT_USER_COUNT).price}<span className="text-xl sm:text-2xl font-normal text-turbo-black">/mo</span>
                    </>
                  ) : (
                    getCurrentPricingTier(CURRENT_USER_COUNT).price
                  )}
                </div>
                
                <div className="mb-8">
                  <h4 className="text-base sm:text-lg font-semibold mb-4 text-turbo-black">Features Included:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Content Proposal</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Outreach Message</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Run of Show</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Production Budget</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Contractor Brief</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-turbo-blue">✓</span>
                      <span className="text-turbo-black">Timeline from Transcript</span>
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-turbo-blue text-turbo-beige rounded">
                        BETA
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full text-center">
                  <button
                    onClick={() => navigate('/sign-up')}
                    className="w-full h-[48px] px-6 font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black hover:text-turbo-beige rounded-full transition-colors"
                  >
                    Get Started For Free
                  </button>
                  <p className="text-xs sm:text-sm text-turbo-black/60 mt-4">
                    Get immediate access • Lock in this price forever
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Price Comparisons Section */}
          {getCurrentPricingTier(CURRENT_USER_COUNT).price !== 'FREE' && (
            <div className="mt-16 bg-turbo-beige rounded-xl p-6 sm:p-8 shadow-lg">
              <h4 className="text-xl sm:text-2xl font-bold mb-8 text-turbo-black text-center">Less Expensive Than:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                {PRICE_COMPARISONS[getCurrentPricingTier(CURRENT_USER_COUNT).price].map((comparison, index) => (
                  <div key={index} className="text-center">
                    <div className="h-24 flex items-center justify-center mb-2 text-4xl" dangerouslySetInnerHTML={{ __html: comparison.emoji }} />
                    {comparison.item && <div className="font-medium text-turbo-black text-xl sm:text-2xl">{comparison.item}</div>}
                    <div className="text-turbo-blue font-medium mt-1">{comparison.price}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Final CTA Section - Now Beige */}
      <section className="py-12 sm:py-24 px-4 bg-turbo-beige text-turbo-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-7xl font-bold mb-6 tracking-tight">
            Ready to Turbocharge Your Creative Business?
          </h2>
          <p className="text-base sm:text-xl mb-8 opacity-80 max-w-2xl mx-auto">
            Join the creators who are saving time and growing their business with Turbo.
          </p>
          
          <div className="max-w-md mx-auto w-full">
            <button
              onClick={() => navigate('/sign-up')}
              className="w-full h-[48px] px-6 font-medium text-turbo-beige bg-turbo-blue hover:bg-turbo-black rounded-full transition-colors"
            >
              Get Started For Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer - Now Beige */}
      <footer className="py-8 sm:py-12 px-4 bg-turbo-beige text-turbo-black">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <a 
              href={links.flickmanMedia}
              target="_blank" 
              rel="noopener noreferrer"
            >
              <img 
                src="/fm-logo.png" 
                alt="Flickman Media Logo" 
                className="h-12 sm:h-9 w-auto" 
              />
            </a>
          </div>
          <div className="text-xs sm:text-sm text-center md:text-left">
            © {new Date().getFullYear()} Flickman Media. All rights reserved.
          </div>
        </div>
      </footer>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={handleToastClose}
        />
      )}
    </main>
  )
}

const slideRightKeyframes = `
  @keyframes slideRight {
    from {
      left: 0;
    }
    to {
      left: calc(33.33% - 8px);
    }
  }
`

const injectGlobalStyles = () => {
  if (typeof document !== 'undefined') {
    const style = document.createElement('style')
    style.innerHTML = slideRightKeyframes
    document.head.appendChild(style)
  }
}

// Inject the styles when the component mounts
if (typeof window !== 'undefined') {
  injectGlobalStyles()
} 