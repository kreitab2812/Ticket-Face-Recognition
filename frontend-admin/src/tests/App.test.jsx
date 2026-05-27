import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    // Kiem tra xem component co render ra text quan trong khong
    const heading = screen.getByText(/Quản Lý/i); 
    expect(heading).toBeInTheDocument();
  });
});
