// Mock function to simulate checkout process
export const createCheckoutSession = async () => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  return true;
}; 