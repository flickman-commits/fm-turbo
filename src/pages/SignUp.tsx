import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '@/services/checkout'
import { links } from '@/config/links'

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

const CURRENT_USERS = 112

const AnimatedCounter = ({ end, duration = 1000 }: { end: number; duration?: number }) => {
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
  const navigate = useNavigate()

  useEffect(() => {
    // Initialize intersection observer for fade-in animations
    const observer = new IntersectionObserver((entries) => {
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
      observer.observe(el)
    })

    // Testimonial rotation
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 2000) // Rotate every 2 seconds

    return () => {
      observer.disconnect()
      clearInterval(interval)
    }
  }, [])

  const handleGetStarted = async () => {
    try {
      await createCheckoutSession()
      navigate('/checkout')
    } catch (error) {
      console.error('Failed to start checkout:', error)
    }
  }

  return (
    <main className="min-h-screen bg-[#E0CFC0]">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-[#3D0C11] tracking-tight animate-on-scroll">
            Turbocharge Your Creative Business
          </h1>
          <p className="text-xl md:text-2xl mb-12 text-[#3D0C11]/80 tracking-tight max-w-3xl mx-auto animate-on-scroll">
            Transform hours of business tasks into seconds. Built specifically for freelance creatives who want to focus on what they do best.
          </p>
          
          <div className="mb-12 animate-on-scroll">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="flex -space-x-1">
                <div className="w-8 h-8 rounded-full bg-[#3D0C11] border-2 border-[#E0CFC0]"></div>
                <div className="w-8 h-8 rounded-full bg-[#3D0C11] border-2 border-[#E0CFC0]"></div>
                <div className="w-8 h-8 rounded-full bg-[#3D0C11] border-2 border-[#E0CFC0]"></div>
              </div>
              <div className="text-lg font-medium text-[#3D0C11]">
                TRUSTED BY <AnimatedCounter end={2000} /> CREATORS AND COUNTING...
              </div>
            </div>
          </div>

          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors animate-on-scroll mb-16"
          >
            Start Free Trial
          </button>

          <div className="animate-on-scroll">
            <div className="text-sm font-medium text-[#3D0C11]/60 mb-8 tracking-tight">
              AS SEEN IN
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 items-center justify-items-center">
              <img src="/fm-logo.png" alt="FM" className="h-6 opacity-30" />
              <img src="/fm-logo.png" alt="FM" className="h-8 opacity-30" />
              <img src="/fm-logo.png" alt="FM" className="h-8 opacity-30" />
              <img src="/fm-logo.png" alt="FM" className="h-6 opacity-30" />
              <img src="/fm-logo.png" alt="FM" className="h-6 opacity-30" />
              <img src="/fm-logo.png" alt="FM" className="h-6 opacity-30" />
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Section */}
      <section className="py-24 px-4 bg-[#3D0C11] text-[#E0CFC0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight animate-on-scroll">
            We Get It Because We Live It
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6 animate-on-scroll">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">The Creative's Dilemma</h3>
                <p>You didn't become a creative to spend hours on proposals and budgets.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">The Time Trap</h3>
                <p>Every hour spent on admin is an hour not spent creating.</p>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">The Quality Question</h3>
                <p>Generic AI tools don't understand the nuances of creative work.</p>
              </div>
            </div>
            <div className="relative h-64 md:h-auto animate-on-scroll">
              {/* TODO: Add supporting image/video */}
              <div className="absolute inset-0 bg-[#E0CFC0]/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Perfect Fit Section */}
      <section className="py-24 px-4 bg-[#E0CFC0]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-[#3D0C11] tracking-tight text-center animate-on-scroll">
            Is Turbo Right for You?
          </h2>
          <div className="grid md:grid-cols-2 gap-8 animate-on-scroll">
            {/* Good Fit Column */}
            <div className="bg-[#3D0C11] text-[#E0CFC0] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>You're a Good Fit If</span>
                <span className="text-3xl">🎯</span>
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-xl">💻</span>
                  <span>You use Premiere Pro, Honeybooks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">👖</span>
                  <span>You wear baggy jeans</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🏃‍♂️</span>
                  <span>You've never had a corporate job (or left the one you did)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">😤</span>
                  <span>Outreach is the most annoying part of your job</span>
                </li>
              </ul>
            </div>

            {/* Not a Fit Column */}
            <div className="bg-[#3D0C11]/10 text-[#3D0C11] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <span>You're NOT a Good Fit If</span>
                <span className="text-3xl">🚫</span>
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="text-xl">🪮</span>
                  <span>You comb your hair every morning</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">⏰</span>
                  <span>You enjoy tedious, time-sucking tasks</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-xl">🤖</span>
                  <span>You've said the words "I don't have a creative bone in my body"</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-24 px-4 bg-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight animate-on-scroll text-[#3D0C11]">
            How it Works
          </h2>
          <p className="text-xl text-[#3D0C11]/80 mb-12 animate-on-scroll">
            Watch how Turbo transforms your creative workflow in seconds
          </p>
          <div className="aspect-video w-full bg-[#3D0C11]/5 rounded-lg shadow-lg animate-on-scroll">
            {/* Video placeholder - replace with actual video component */}
            <div className="flex items-center justify-center h-full">
              <div className="text-[#3D0C11]/40 text-lg">Video Demo Coming Soon</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-[#3D0C11] tracking-tight text-center animate-on-scroll">
            Purpose-Built for Creatives
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse animate-on-scroll">
              <thead>
                <tr className="border-b-2 border-[#3D0C11]">
                  <th className="py-4 px-6 text-left text-[#3D0C11]">Feature</th>
                  <th className="py-4 px-6 text-center text-[#3D0C11]">Turbo</th>
                  <th className="py-4 px-6 text-center text-[#3D0C11]">ChatGPT</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#3D0C11]/20">
                  <td className="py-4 px-6 text-[#3D0C11]">Industry-Specific Templates</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✓</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✗</td>
                </tr>
                <tr className="border-b border-[#3D0C11]/20">
                  <td className="py-4 px-6 text-[#3D0C11]">Run of Show Generator</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✓</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✗</td>
                </tr>
                <tr className="border-b border-[#3D0C11]/20">
                  <td className="py-4 px-6 text-[#3D0C11]">Weather Integration</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✓</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✗</td>
                </tr>
                <tr className="border-b border-[#3D0C11]/20">
                  <td className="py-4 px-6 text-[#3D0C11]">Production Budget Calculator</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✓</td>
                  <td className="py-4 px-6 text-center text-[#3D0C11]">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4 bg-[#3D0C11] text-[#E0CFC0]">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight animate-on-scroll">
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
                    <div className="bg-[#E0CFC0]/10 rounded-lg p-8 h-full flex flex-col items-center justify-center">
                      <img
                        src={testimonial.image}
                        alt={testimonial.name}
                        className="w-20 h-20 rounded-full mb-6 opacity-30"
                      />
                      <p className="text-xl mb-6 italic">"{testimonial.text}"</p>
                      <div className="mt-auto">
                        <p className="font-semibold text-lg">{testimonial.name}</p>
                        <p className="text-[#E0CFC0]/60">{testimonial.role}</p>
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
                    ? 'bg-[#E0CFC0] w-4'
                    : 'bg-[#E0CFC0]/30'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6 text-[#3D0C11] tracking-tight">
            Pricing
          </h2>
          <p className="text-xl mb-12 text-[#3D0C11]/80">
            We're keeping it simple early on. Get all the Turbo features for one monthly price.
          </p>
          <p className="text-lg mb-8 text-[#3D0C11]/80">
            Start with a 7-day free trial. Cancel if you hate it.
          </p>
          <p className="text-lg mb-12 text-[#3D0C11]/80">
            You'll lock in this price forever. It pays to be early and thanks for being one of our early customers.
          </p>

          <div className="bg-[#3D0C11]/5 rounded-xl p-4 mb-12 inline-block">
            <div className="text-lg font-medium text-[#3D0C11] flex items-center gap-2">
              Current Users: <AnimatedCounter end={CURRENT_USERS} duration={2000} />
            </div>
          </div>

          <div className="relative max-w-2xl mx-auto">
            <div className="h-1 bg-[#3D0C11]/20 rounded-full mb-8">
              <div 
                className="absolute -top-2 w-4 h-4 bg-[#4F46E5] rounded-full" 
                style={{ 
                  left: 0,
                  animation: 'slideRight 2s ease-out forwards',
                }}
              />
            </div>
            <div className="flex justify-between text-[#3D0C11]">
              <div>
                <div className="text-2xl font-bold">$10<span className="text-lg font-normal">/mo</span></div>
                <div className="text-sm">first 10 users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$20<span className="text-lg font-normal">/mo</span></div>
                <div className="text-sm">first 100 users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$40<span className="text-lg font-normal">/mo</span></div>
                <div className="text-sm">first 1000 users</div>
              </div>
              <div>
                <div className="text-2xl font-bold">¯\_(ツ)_/¯</div>
                <div className="text-sm">after beta</div>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-[#3D0C11]/5 rounded-xl p-8 max-w-md mx-auto">
            <h3 className="text-2xl font-bold mb-4 text-[#3D0C11]">Current Price</h3>
            <div className="text-6xl font-bold text-[#3D0C11] mb-8">$20<span className="text-2xl font-normal">/mo</span></div>
            
            <div className="mb-8">
              <h4 className="text-lg font-semibold mb-4 text-[#3D0C11]">Everything You Need:</h4>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3">
                  <span className="text-[#3D0C11]">✓</span>
                  <span className="text-[#3D0C11]/80">Run of Show Generator</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#3D0C11]">✓</span>
                  <span className="text-[#3D0C11]/80">Call Sheet Generator</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#3D0C11]">✓</span>
                  <span className="text-[#3D0C11]/80">Weather Integration</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#3D0C11]">✓</span>
                  <span className="text-[#3D0C11]/80">Production Budget Calculator</span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#3D0C11]">✓</span>
                  <span className="text-[#3D0C11]/80">Client Proposal Generator</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
              className="w-full inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors"
            >
              Start Free Trial
            </button>
            <p className="text-sm text-[#3D0C11]/60 mt-4 text-center">
              7-day free trial • Lock in this price forever
            </p>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-24 px-4 bg-[#3D0C11]/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-medium mb-8 text-[#3D0C11]/70 tracking-tight animate-on-scroll">
            TRUSTED BY CREATORS FROM
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center animate-on-scroll">
            {/* Add company logos */}
            <div className="w-32 h-12 bg-[#3D0C11]/10 rounded"></div>
            <div className="w-32 h-12 bg-[#3D0C11]/10 rounded"></div>
            <div className="w-32 h-12 bg-[#3D0C11]/10 rounded"></div>
            <div className="w-32 h-12 bg-[#3D0C11]/10 rounded"></div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 bg-[#3D0C11] text-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight animate-on-scroll">
            Ready to Turbocharge Your Creative Business?
          </h2>
          <p className="text-xl mb-8 opacity-80 max-w-2xl mx-auto animate-on-scroll">
            Join thousands of creators who are saving time and growing their business with Turbo.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#3D0C11] bg-[#E0CFC0] rounded-full hover:bg-[#E0CFC0]/90 transition-colors animate-on-scroll"
          >
            Start Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-[#3D0C11] text-[#E0CFC0]/70">
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
                className="h-8 w-auto [filter:brightness(0)_saturate(100%)_invert(100%)_sepia(0%)_saturate(0%)_hue-rotate(0deg)_brightness(100%)_contrast(100%)]" 
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