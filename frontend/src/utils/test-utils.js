import React from 'react';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../components/Auth/AuthContext';

// Mock auth context for tests
export const MockAuthProvider = ({ children, value = {} }) => {
  const defaultValue = {
    user: null,
    token: null,
    login: jest.fn(),
    logout: jest.fn(),
    loading: false,
    ...value
  };

  return (
    <AuthProvider value={defaultValue}>
      {children}
    </AuthProvider>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    authValue = {},
    route = '/',
    ...renderOptions
  } = options;

  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <MockAuthProvider value={authValue}>
        {children}
      </MockAuthProvider>
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Add custom queries or utilities here
  };
};

// Mock API responses
export const mockApiResponse = (data, status = 200) => ({
  data,
  status,
  ok: status >= 200 && status < 300,
});

// Mock user data
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  is_staff: false,
};

export const mockAdminUser = {
  ...mockUser,
  id: 2,
  username: 'admin',
  email: 'admin@example.com',
  is_staff: true,
};

// Mock portfolio data
export const mockPortfolio = {
  id: 1,
  title: 'Test Portfolio',
  description: 'Test Description',
  image: 'https://example.com/image.jpg',
  link: 'https://example.com',
  user: mockUser,
};

// Mock asset data
export const mockAsset = {
  id: 1,
  title: 'Test Asset',
  description: 'Test Asset Description',
  price: 29.99,
  preview_image: 'https://example.com/asset.jpg',
  seller: mockUser,
  category: { id: 1, name: 'Graphics' },
  is_active: true,
  is_featured: false,
};

// Test helpers
export const waitForLoadingToFinish = () =>
  new Promise(resolve => setTimeout(resolve, 0));

export * from '@testing-library/react';
export { renderWithProviders as render };
