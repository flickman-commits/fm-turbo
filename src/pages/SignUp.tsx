import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '@/services/checkout'
import { links } from '@/config/links'
import { PRICING_TIERS, getCurrentPricingTier, formatPrice, getSliderPosition } from '@/utils/pricing'
import { PRICE_COMPARISONS } from '@/utils/priceComparisons'

// This can be updated when we get new user counts
export const CURRENT_USER_COUNT = 112

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Photographer",
    text: "Turbo has completely transformed how I handle my production schedules. What used to take hours now takes minutes.",
    image: "/fm-logo.png"
  },
  {
    name: "Michael Chen",
    role: "Video Director",
    text: "The run of show generator is a game-changer. My crew always knows exactly what's happening and when.",
    image: "/fm-logo.png"
  },
  {
    name: "Emma Davis",
    role: "Production Manager",
    text: "I can't imagine going back to manual scheduling. Turbo has saved me countless hours of work.",
    image: "/fm-logo.png"
  },
  {
    name: "James Wilson",
    role: "Creative Director",
    text: "The attention to detail in the generated documents is impressive. It's like having a professional assistant.",
    image: "/fm-logo.png"
  },
  {
    name: "Lisa Rodriguez",
    role: "Event Photographer",
    text: "From call sheets to schedules, everything is perfectly formatted and professional. My clients love it.",
    image: "/fm-logo.png"
  }
];

const AnimatedCounter = ({ end, duration = 1000, start = false }: { end: number; duration?: number; start: boolean }) => {
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

const HeroCounter = ({ end, duration = 1000 }: { end: number; duration?: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
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
  }, [end, duration])

  return <span>{count}</span>
}

export default function SignUp() {
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [isPricingVisible, setIsPricingVisible] = useState(false)
  const pricingSliderRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const currentTier = getCurrentPricingTier(CURRENT_USER_COUNT)

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
    }, 2000) // Rotate every 2 seconds

    return () => {
      fadeObserver.disconnect()
      pricingObserver.disconnect()
      clearInterval(interval)
    }
  }, [isPricingVisible])

  const handleGetStarted = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = 'https://buy.stripe.com/bIY03Zg215Y40TucMO';
  };

  return (
    <main className="min-h-screen bg-[#F5F0E8]">
      {/* Hero Section - Beige */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden bg-[#F5F0E8]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-black tracking-tight animate-on-scroll">
            Turbocharge Your Creative Business
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-black/80 tracking-tight max-w-3xl mx-auto animate-on-scroll">
            Transform hours of business tasks into seconds. Built specifically for freelance creatives who want to focus on what they do best.
          </p>
          
          <div className="mb-12 animate-on-scroll">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-2">
                <img 
                  src="/profile-pic-1.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-[#F5F0E8] object-cover relative z-30"
                />
                <img 
                  src="/profile-pic-2.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-[#F5F0E8] object-cover relative z-20"
                />
                <img 
                  src="/profile-pic-3.jpg" 
                  alt="Creator profile" 
                  className="w-8 h-8 rounded-full border-2 border-[#F5F0E8] object-cover relative z-10"
                />
              </div>
              <div className="text-lg font-medium text-black">
                TRUSTED BY <HeroCounter end={CURRENT_USER_COUNT} duration={2000} /> CREATORS AND COUNTING...
              </div>
            </div>
          </div>

          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#F5F0E8] bg-black rounded-full hover:bg-[#E94E1B] transition-colors animate-on-scroll mb-16"
          >
            Start Free Trial
          </button>

          <div className="animate-on-scroll">
            <div className="text-sm font-bold text-[#E94E1B]/60 mb-8 tracking-tight">
              TRUSTED BY CREATORS FROM
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
              <img src="/times-logo.png" alt="Times" className="h-18 opacity-30" />
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section - Black */}
      <section className="py-24 px-4 bg-black text-[#F5F0E8]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight animate-on-scroll">
              How it Works
            </h2>
            <p className="text-xl mb-12 opacity-80 animate-on-scroll">
              Watch how Turbo transforms your creative workflow in seconds
            </p>
            <div className="bg-[#F5F0E8]/10 rounded-xl p-8 backdrop-blur-sm">
              <div className="aspect-video rounded-lg bg-[#F5F0E8]/5 flex items-center justify-center">
                <p className="text-[#F5F0E8]/60">Video Demo Coming Soon</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-16">
            <div className="space-y-8">
              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Content Proposal</h3>
                    <p className="text-[#F5F0E8]/80">Generate professional proposals in seconds, increasing your win rate and saving hours of writing time</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">💌</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Outreach Message</h3>
                    <p className="text-[#F5F0E8]/80">Craft personalized outreach messages that get responses, turning cold leads into warm conversations</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">📋</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Run of Show</h3>
                    <p className="text-[#F5F0E8]/80">Create detailed production schedules instantly, keeping your crew organized and shoots running smoothly</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">💰</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Production Budget</h3>
                    <p className="text-[#F5F0E8]/80">Generate accurate budgets quickly, ensuring profitability while maintaining transparency with clients</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Contractor Brief</h3>
                    <p className="text-[#F5F0E8]/80">Create clear, comprehensive briefs for your team, ensuring everyone knows their roles and deliverables</p>
                  </div>
                </div>
              </div>

              <div className="animate-on-scroll">
                <div className="flex items-start gap-4">
                  <div className="bg-[#E94E1B] rounded-lg p-3">
                    <span className="text-2xl">⏱️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Timeline from Transcript <span className="text-xs bg-[#E94E1B] px-1.5 py-0.5 rounded ml-2">BETA</span></h3>
                    <p className="text-[#F5F0E8]/80">Convert interview transcripts into organized timelines automatically, cutting post-production planning time in half</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Purpose-Built Section - Beige */}
      <section className="py-24 px-4 bg-[#F5F0E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-12 tracking-tight text-center text-black animate-on-scroll">
            Purpose-Built for Creatives
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E94E1B]">
                  <th className="py-4 px-6 text-left text-[#E94E1B] font-medium">Feature</th>
                  <th className="py-4 px-6 text-center text-[#E94E1B] font-medium">Turbo</th>
                  <th className="py-4 px-6 text-center text-[#E94E1B] font-medium">ChatGPT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#E94E1B]/20">
                  <td className="py-4 px-6 text-[#E94E1B]">Pre-defined tasks that are relevant to your business</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✗</td>
                </tr>
                <tr className="border-b border-[#E94E1B]/20">
                  <td className="py-4 px-6 text-[#E94E1B]">Custom prompts built for freelance creatives</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✗</td>
                </tr>
                <tr className="border-b border-[#E94E1B]/20">
                  <td className="py-4 px-6 text-[#E94E1B]">Created by nerds that are also creatives</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✗</td>
                </tr>
                <tr className="border-b border-[#E94E1B]/20">
                  <td className="py-4 px-6 text-[#E94E1B]">Aesthetic interface</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✗</td>
                </tr>
                <tr className="border-b border-[#E94E1B]/20">
                  <td className="py-4 px-6 text-[#E94E1B]">Built on OpenAI</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                  <td className="py-4 px-6 text-center text-[#E94E1B]">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Understanding Section */}
      <section className="py-24 px-4 bg-black text-[#F5F0E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold mb-12 tracking-tight animate-on-scroll">
            We Get It Because We Live It
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 animate-on-scroll">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#29ABE2]">The Creative's Dilemma</h3>
                <p>You didn't become a creative to spend hours on proposals and budgets.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#00A651]">The Time Trap</h3>
                <p>Every hour spent on admin is an hour not spent creating.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold text-[#E94E1B]">The Quality Question</h3>
                <p>Generic AI tools don't understand the nuances of creative work.</p>
              </div>
              <div className="mt-8">
                <a 
                  href="https://loom.com/share/folder/1e6008374a5c4d4c862d760843a0b1de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-black bg-[#F5F0E8] rounded-full hover:bg-[#29ABE2] hover:text-[#F5F0E8] transition-colors whitespace-nowrap"
                >
                  Watch live product development calls
                </a>
              </div>
            </div>
            <div className="relative h-64 md:h-auto animate-on-scroll">
              {/* TODO: Add supporting image/video */}
              <div className="absolute inset-0 bg-[#F5F0E8]/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Coral */}
      <section className="py-24 px-4 bg-[#E94E1B] text-[#F5F0E8]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-bold mb-12 tracking-tight text-center animate-on-scroll">
            What Creators Are Saying
          </h2>
          <div className="relative h-[400px] overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              {testimonials.map((testimonial, index) => {
                // Calculate position relative to active testimonial
                const position = ((index - activeTestimonial + testimonials.length) % testimonials.length);
                const isVisible = position <= 2;
                
                // Calculate x-offset based on position
                let translateX = '100%';
                let scale = '0.8';
                let opacity = '0.3';
                let zIndex = '0';
                
                if (position === 0) {
                  translateX = '-100%';
                  scale = '0.8';
                  opacity = '0.3';
                  zIndex = '1';
                } else if (position === 1) {
                  translateX = '0';
                  scale = '1';
                  opacity = '1';
                  zIndex = '2';
                } else if (position === 2) {
                  translateX = '100%';
                  scale = '0.8';
                  opacity = '0.3';
                  zIndex = '1';
                }

                return (
                  <div
                    key={index}
                    className={`absolute w-full max-w-xl transition-all duration-500 ${!isVisible ? 'opacity-0' : ''}`}
                    style={{
                      transform: `translateX(${translateX}) scale(${scale})`,
                      opacity,
                      zIndex,
                    }}
                  >
                    <div className="bg-[#F5F0E8] rounded-lg p-8 h-full flex flex-col items-center justify-center text-black">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full mb-6"
                      />
                      <p className="text-xl mb-6 italic text-black/80">"{testimonial.text}"</p>
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
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeTestimonial
                    ? 'bg-[#F5F0E8] w-4'
                    : 'bg-[#F5F0E8]/30'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - Beige */}
      <section className="py-24 px-4 bg-[#F5F0E8]">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-[1fr,400px] gap-8">
            {/* Left Column - Pricing Info */}
            <div className="text-center md:text-left">
              <h2 className="text-5xl md:text-7xl font-bold mb-6 text-black tracking-tight">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl mb-8 text-black/80">
                We're keeping it simple—get all Turbo features for one monthly price.
              </p>
              <p className="text-lg mb-12 text-black/80">
                We want to reward early customers, so the price you pay today is locked in for life.
              </p>

              <div className="bg-black/5 rounded-xl p-4 mb-12 inline-block hover:bg-[#00A651]/10 transition-colors">
                <div className="text-lg font-medium text-black flex items-center gap-2">
                  Current Users: <AnimatedCounter end={CURRENT_USER_COUNT} duration={1000} start={isPricingVisible} />
                </div>
              </div>

              <div className="relative max-w-2xl" ref={pricingSliderRef}>
                <div className="h-1 bg-black/20 rounded-full mb-8">
                  <div 
                    className="absolute -top-2 w-4 h-4 bg-[#29ABE2] rounded-full transition-all duration-1000 -translate-x-1/2" 
                    style={{ 
                      left: isPricingVisible ? `${getSliderPosition(CURRENT_USER_COUNT)}%` : '0%',
                    }}
                  />
                </div>
                <div className="flex justify-between text-black">
                  {PRICING_TIERS.map((tier, index) => (
                    <div 
                      key={index} 
                      className={`${currentTier === tier ? 'opacity-100' : 'opacity-60'}`}
                      style={{
                        position: 'absolute',
                        left: `${tier.position}%`,
                        transform: 'translateX(-50%)',
                        width: 'max-content'
                      }}
                    >
                      <div className="text-2xl font-bold">
                        {typeof tier.price === 'number' ? (
                          <>
                            ${tier.price}<span className="text-lg font-normal">/mo</span>
                          </>
                        ) : (
                          tier.price
                        )}
                      </div>
                      <div className="text-sm">{tier.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Pricing Card */}
            <div className="md:sticky md:top-8">
              <div className="bg-white rounded-xl p-8 shadow-lg">
                <h3 className="text-2xl font-bold mb-4 text-black">Current Price</h3>
                <div className="text-6xl font-bold text-black mb-8">
                  {typeof currentTier.price === 'number' ? (
                    <>
                      ${currentTier.price}<span className="text-2xl font-normal">/mo</span>
                    </>
                  ) : (
                    currentTier.price
                  )}
                </div>
                
                <div className="mb-8">
                  <h4 className="text-lg font-semibold mb-4 text-black">Tasks Included:</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Content Proposal</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Outreach Message</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Run of Show</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Production Budget</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Contractor Brief</span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-[#00A651]">✓</span>
                      <span className="text-[#E94E1B]/80">Timeline from Transcript</span>
                      <span className="px-1.5 py-0.5 text-xs font-medium bg-[#E94E1B] text-[#F5F0E8] rounded">
                        BETA
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGetStarted}
                  className="w-full inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#F5F0E8] bg-black rounded-full hover:bg-[#29ABE2] transition-colors"
                >
                  Start Free Trial
                </button>
                <p className="text-sm text-black/60 mt-4 text-center">
                  7-day free trial • Lock in this price forever
                </p>
              </div>
            </div>
          </div>

          {/* Price Comparisons Section */}
          <div className="mt-16 bg-white rounded-xl p-8 shadow-lg">
            <h4 className="text-2xl font-bold mb-8 text-black text-center">Less Expensive Than:</h4>
            <div className={`grid ${currentTier.price === 'FREE' ? 'grid-cols-1' : 'grid-cols-3'} gap-8`}>
              {PRICE_COMPARISONS[currentTier.price].map((comparison, index) => (
                <div key={index} className={`text-center ${currentTier.price === 'FREE' ? 'mx-auto' : ''}`}>
                  <div className="text-6xl mb-4">{comparison.emoji}</div>
                  <div className="font-medium text-black text-2xl">{comparison.item}</div>
                  <div className="text-[#E94E1B] font-medium mt-1">{comparison.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section - Black */}
      <section className="py-24 px-4 bg-black text-[#F5F0E8]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight animate-on-scroll">
            Ready to Turbocharge Your Creative Business?
          </h2>
          <p className="text-xl mb-8 opacity-80 max-w-2xl mx-auto animate-on-scroll">
            Join thousands of creators who are saving time and growing their business with Turbo.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-black bg-[#F5F0E8] rounded-full hover:bg-[#29ABE2] hover:text-[#F5F0E8] transition-colors animate-on-scroll"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer - Black */}
      <footer className="py-12 px-4 bg-black text-[#F5F0E8]">
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
                className="h-9 w-auto [filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]" 
              />
            </a>
          </div>
          <div className="text-sm">
            © {new Date().getFullYear()} Flickman Media. All rights reserved.
          </div>
        </div>
      </footer>
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