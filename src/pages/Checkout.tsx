import { useState } from 'react';
import { toast } from '@/components/ui/rainbow-toast';
import { useNavigate } from 'react-router-dom';
import { createCheckoutSession } from '@/services/checkout';

const testData = {
  workEmail: 'test@flickmanmedia.com',
  firstName: 'John',
  lastName: 'Doe',
  companyName: 'Flickman Media',
  jobTitle: 'Creative Director',
  companySize: '2-10',
  useCase: 'runOfShow',
  details: 'I need help automating my production workflows, especially for creating run of shows and call sheets for my video productions.'
};

export default function Checkout() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    workEmail: '',
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: '',
    companySize: '',
    useCase: '',
    details: ''
  });

  const validateEmail = (email: string) => {
    return email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  };

  const validateForm = () => {
    if (!validateEmail(formData.workEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    // Check if any required field is empty
    const requiredFields = ['firstName', 'lastName', 'companyName', 'jobTitle', 'companySize', 'useCase', 'details'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please fill in ${field.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
        return false;
      }
    }

    // Validate minimum length for details
    if (formData.details.length < 10) {
      toast.error('Please provide more details about how you want to use FM Turbo');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const loadingToast = toast.loading('Setting up your account...');
      
      // Store user data in localStorage or your preferred state management
      localStorage.setItem('userEmail', formData.workEmail);
      localStorage.setItem('userName', `${formData.firstName} ${formData.lastName}`);
      
      // Simulate a delay to show loading state (remove in production)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.dismiss(loadingToast);
      toast.success('Account created successfully!');
      
      // Small delay before navigation to show success message
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to create account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const fillTestData = () => {
    setFormData(testData);
    toast.success('Test data filled');
  };

  return (
    <main className="min-h-screen bg-[#E0CFC0]">
      <div className="container mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12">
        {/* Left Column - Form */}
        <div className="flex-1 max-w-2xl mx-auto lg:mx-0">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-[#3D0C11]">
              Get started with FM Turbo
            </h1>
            <button
              type="button"
              onClick={fillTestData}
              className="px-4 py-2 text-sm font-medium text-[#3D0C11] bg-transparent border border-[#3D0C11] rounded-lg hover:bg-[#3D0C11] hover:text-[#E0CFC0] transition-colors"
            >
              Fill Test Data
            </button>
          </div>
          
          <p className="text-xl text-[#3D0C11]/80 mb-12">
            AI for streamlining creative production workflows. Transform your document creation process and save hours on administrative tasks.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="workEmail" className="block text-sm font-medium text-[#3D0C11] mb-1">
                  Work email*
                </label>
                <input
                  type="email"
                  id="workEmail"
                  name="workEmail"
                  required
                  value={formData.workEmail}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-[#3D0C11] mb-1">
                    First name*
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-[#3D0C11] mb-1">
                    Last name*
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="companyName" className="block text-sm font-medium text-[#3D0C11] mb-1">
                    Company name*
                  </label>
                  <input
                    type="text"
                    id="companyName"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                  />
                </div>
                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-[#3D0C11] mb-1">
                    Job title*
                  </label>
                  <input
                    type="text"
                    id="jobTitle"
                    name="jobTitle"
                    required
                    value={formData.jobTitle}
                    onChange={handleChange}
                    className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="companySize" className="block text-sm font-medium text-[#3D0C11] mb-1">
                  Company size*
                </label>
                <select
                  id="companySize"
                  name="companySize"
                  required
                  value={formData.companySize}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                >
                  <option value="">Please Select</option>
                  <option value="1">Just me</option>
                  <option value="2-10">2-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51+">51+ employees</option>
                </select>
              </div>

              <div>
                <label htmlFor="useCase" className="block text-sm font-medium text-[#3D0C11] mb-1">
                  Which solution are you most interested in?*
                </label>
                <select
                  id="useCase"
                  name="useCase"
                  required
                  value={formData.useCase}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                >
                  <option value="">Please Select</option>
                  <option value="runOfShow">Run of Show Generator</option>
                  <option value="callSheets">Call Sheet Creation</option>
                  <option value="budgets">Production Budgets</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="details" className="block text-sm font-medium text-[#3D0C11] mb-1">
                  Tell us more about how you want to use FM Turbo*
                </label>
                <textarea
                  id="details"
                  name="details"
                  required
                  value={formData.details}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-[#3D0C11]/20 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D0C11]/20"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-[48px] bg-[#3D0C11] text-[#E0CFC0] rounded-lg font-medium hover:bg-[#3D0C11]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Creating Account...' : 'Start Free Trial'}
              </button>
              <p className="text-sm text-[#3D0C11]/60 mt-2 text-center">
                No credit card required
              </p>
            </div>
          </form>
        </div>

        {/* Right Column - Benefits */}
        <div className="flex-1 max-w-md mx-auto lg:mx-0">
          <div className="bg-[#3D0C11] text-[#E0CFC0] p-8 rounded-xl">
            <h2 className="text-2xl font-bold mb-6">
              What you'll get:
            </h2>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="mr-3 mt-1">✓</span>
                <div>
                  <h3 className="font-medium">AI-Powered Document Generation</h3>
                  <p className="text-[#E0CFC0]/80">Create professional run of shows, call sheets, and budgets in seconds</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">✓</span>
                <div>
                  <h3 className="font-medium">Smart Integrations</h3>
                  <p className="text-[#E0CFC0]/80">Automatic weather data, location details, and Google Maps integration</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">✓</span>
                <div>
                  <h3 className="font-medium">Industry-Specific Templates</h3>
                  <p className="text-[#E0CFC0]/80">Pre-built templates designed specifically for creative professionals</p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1">✓</span>
                <div>
                  <h3 className="font-medium">7-Day Free Trial</h3>
                  <p className="text-[#E0CFC0]/80">Full access to all features with no credit card required</p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
} 