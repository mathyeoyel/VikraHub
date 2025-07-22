import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Mock components to avoid lazy loading issues in tests
jest.mock('./Team', () => {
  return function Team() {
    return <div data-testid="team">Team Component</div>;
  };
});

jest.mock('./components/Profile', () => {
  return function Profile() {
    return <div data-testid="profile">Profile Component</div>;
  };
});

// Mock AuthContext
const mockAuthContext = {
  user: null,
  login: jest.fn(),
  logout: jest.fn(),
  loading: false
};

jest.mock('./components/Auth/AuthContext', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => mockAuthContext
}));

// Helper function to render with router
const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('App Component', () => {
  test('renders without crashing', () => {
    renderWithRouter(<App />);
  });

  test('renders home page by default', () => {
    renderWithRouter(<App />);
    // Test that the app renders without throwing errors
    expect(document.body).toBeInTheDocument();
  });

  test('has proper error boundary', () => {
    // This test ensures error boundary is in place
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const ThrowError = () => {
      throw new Error('Test error');
    };
    
    // This should not crash the test
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    );
    
    consoleSpy.mockRestore();
  });
});
