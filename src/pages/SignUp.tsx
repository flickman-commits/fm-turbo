import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createCheckoutSession } from '@/services/checkout'
import { links } from '@/config/links'

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Freelance Photographer",
    text: "FM Turbo has completely transformed how I handle my production schedules. What used to take hours now takes minutes.",
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
    text: "I can't imagine going back to manual scheduling. FM Turbo has saved me countless hours of work.",
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

const AnimatedCounter = ({ end }: { end: number }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const duration = 1000 // 1 second
    const steps = 60
    const increment = end / steps
    const interval = duration / steps

    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= end) {
        setCount(end)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, interval)

    return () => clearInterval(timer)
  }, [end])

  return <span>{count.toLocaleString()}+</span>
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
            Get Started for Free
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

      {/* How it Works Section */}
      <section className="py-24 px-4 bg-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-8 tracking-tight animate-on-scroll text-[#3D0C11]">
            How it Works
          </h2>
          <p className="text-xl text-[#3D0C11]/80 mb-12 animate-on-scroll">
            Watch how FM Turbo transforms your creative workflow in seconds
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
                  <th className="py-4 px-6 text-center text-[#3D0C11]">FM Turbo</th>
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
      <section className="py-24 px-4 bg-[#3D0C11] text-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight animate-on-scroll">
            Pricing
          </h2>
          <p className="text-xl mb-4 opacity-80 animate-on-scroll">
            No monthly subscription.
          </p>
          <p className="text-xl mb-12 opacity-80 animate-on-scroll">
            You pay once and it's yours for life.
          </p>
          <h3 className="text-2xl font-bold mb-12 tracking-tight animate-on-scroll">
            Discount for early adopters.
          </h3>

          {/* Pricing Timeline */}
          <div className="relative max-w-3xl mx-auto mb-16 animate-on-scroll">
            <div className="h-1 bg-[#E0CFC0]/20 absolute top-4 left-0 right-0"></div>
            <div className="flex justify-between relative">
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-[#E0CFC0] mx-auto mb-2 relative z-10"></div>
                <div className="font-bold text-2xl">$99</div>
                <div className="text-sm opacity-60">first 10 users</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-[#4361EE] mx-auto mb-2 relative z-10"></div>
                <div className="font-bold text-2xl">$199</div>
                <div className="text-sm opacity-60">first 100 users</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-[#E0CFC0]/20 mx-auto mb-2 relative z-10"></div>
                <div className="font-bold text-2xl">$299</div>
                <div className="text-sm opacity-60">first 1000 users</div>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 rounded-full bg-[#E0CFC0]/20 mx-auto mb-2 relative z-10"></div>
                <div className="font-bold text-2xl">$499</div>
                <div className="text-sm opacity-60">after beta</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 animate-on-scroll">
            {/* Standard Plan */}
            <div className="bg-[#E0CFC0] text-[#3D0C11] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">Life Time Deal</h3>
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-lg line-through opacity-50">$299</span>
              </div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Unlimited document generation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>All premium templates</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Weather & location integration</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Up to 5 team members</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors"
              >
                Get Started
              </button>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#E0CFC0] text-[#3D0C11] rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-2">LTD PRO</h3>
              <div className="flex items-baseline justify-center gap-2 mb-6">
                <span className="text-4xl font-bold">$499</span>
                <span className="text-lg line-through opacity-50">$999</span>
              </div>
              <ul className="text-left space-y-4 mb-8">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Everything in Life Time Deal</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Up to 15 team members</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Advanced AI customization</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Custom branding</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>API access</span>
                </li>
              </ul>
              <button
                onClick={handleGetStarted}
                className="w-full inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors"
              >
                Get Started
              </button>
            </div>
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
            Join thousands of creators who are saving time and growing their business with FM Turbo.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#3D0C11] bg-[#E0CFC0] rounded-full hover:bg-[#E0CFC0]/90 transition-colors animate-on-scroll"
          >
            Get Started for Free
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