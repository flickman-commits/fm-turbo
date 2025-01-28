export interface AccountData {
  workEmail: string;
  firstName: string;
  lastName: string;
  companyName: string;
  jobTitle: string;
  companySize: string;
  useCase: string;
  details: string;
}

export const createAccount = async (data: AccountData): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Log the data that would be sent to the server
  console.log('Creating account with data:', data);
  
  return true;
}; 