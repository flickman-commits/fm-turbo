import { useEffect } from 'react'
import { links } from '@/config/links'

export default function SignUp() {
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

    return () => observer.disconnect()
  }, [])

  const handleGetStarted = () => {
    // TODO: Implement Stripe checkout
    console.log('Redirecting to checkout...')
  }

  return (
    <main className="min-h-screen bg-[#E0CFC0]">
      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-[#3D0C11] tracking-tight animate-on-scroll">
            Turbocharge Your Creative Business
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-[#3D0C11]/80 tracking-tight max-w-2xl mx-auto animate-on-scroll">
            Transform hours of business tasks into seconds. Built specifically for freelance creatives who want to focus on what they do best.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors animate-on-scroll"
          >
            Get Started for Free
          </button>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-6 border-b-2 border-r-2 border-[#3D0C11] rotate-45"></div>
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

      {/* Pricing Section */}
      <section className="py-24 px-4 bg-[#3D0C11] text-[#E0CFC0]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 tracking-tight animate-on-scroll">
            Simple, Transparent Pricing
          </h2>
          <div className="bg-[#E0CFC0] text-[#3D0C11] rounded-2xl p-8 max-w-md mx-auto animate-on-scroll">
            <h3 className="text-2xl font-bold mb-4">Pro Plan</h3>
            <div className="text-4xl font-bold mb-2">$49<span className="text-lg">/month</span></div>
            <p className="text-[#3D0C11]/70 mb-6">First 7 days free</p>
            <ul className="text-left space-y-4 mb-8">
              <li className="flex items-center">
                <span className="mr-2">✓</span> Unlimited document generation
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> All premium templates
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Weather & location integration
              </li>
              <li className="flex items-center">
                <span className="mr-2">✓</span> Priority support
              </li>
            </ul>
            <button
              onClick={handleGetStarted}
              className="w-full inline-flex items-center justify-center h-[48px] px-8 py-2 text-lg font-medium text-[#E0CFC0] bg-[#3D0C11] rounded-full hover:bg-[#3D0C11]/90 transition-colors"
            >
              Get Started for Free
            </button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold mb-12 text-[#3D0C11] tracking-tight text-center animate-on-scroll">
            What Creators Are Saying
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-lg animate-on-scroll">
              <p className="text-[#3D0C11]/80 mb-4">"FM Turbo has completely transformed how I handle the business side of my creative work. What used to take hours now takes minutes."</p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-[#3D0C11]/10 rounded-full"></div>
                <div className="ml-3">
                  <div className="font-semibold text-[#3D0C11]">Sarah Johnson</div>
                  <div className="text-sm text-[#3D0C11]/70">Independent Filmmaker</div>
                </div>
              </div>
            </div>
            {/* Add more testimonials */}
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