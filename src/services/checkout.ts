interface CheckoutData {
  workEmail: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  companySize: string;
  useCase: string;
  details: string;
}

// Mock function to simulate checkout process
export const createCheckoutSession = async (data?: CheckoutData) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the data that would be sent to the server
  if (data) {
    console.log('Creating checkout session with data:', data);
  }
  
  return true;
}; 