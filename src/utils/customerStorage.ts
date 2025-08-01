export interface Customer {
  id: string;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  oib: string;
  timestamp: string;
}

const CUSTOMERS_STORAGE_KEY = 'savedCustomers';

export const saveCustomer = (customer: Omit<Customer, 'id' | 'timestamp'>) => {
  try {
    const existingCustomers = getCustomers();
    
    // Check if customer with same OIB already exists
    const existingIndex = existingCustomers.findIndex(c => c.oib === customer.oib);
    
    const newCustomer: Customer = {
      ...customer,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      // Update existing customer
      existingCustomers[existingIndex] = newCustomer;
    } else {
      // Add new customer
      existingCustomers.unshift(newCustomer); // Add to beginning
    }

    // Keep only last 20 customers
    const limitedCustomers = existingCustomers.slice(0, 20);
    
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(limitedCustomers));
    return true;
  } catch (error) {
    console.error('Error saving customer:', error);
    return false;
  }
};

export const getCustomers = (): Customer[] => {
  try {
    const customers = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
    return customers ? JSON.parse(customers) : [];
  } catch (error) {
    console.error('Error getting customers:', error);
    return [];
  }
};

export const removeCustomer = (id: string): boolean => {
  try {
    const customers = getCustomers();
    const filteredCustomers = customers.filter(c => c.id !== id);
    localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(filteredCustomers));
    return true;
  } catch (error) {
    console.error('Error removing customer:', error);
    return false;
  }
};

export const clearCustomers = (): boolean => {
  try {
    localStorage.removeItem(CUSTOMERS_STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing customers:', error);
    return false;
  }
}; 