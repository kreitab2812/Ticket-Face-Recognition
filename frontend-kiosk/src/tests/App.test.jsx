import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    
    // Phai sua dong nay va NHO BAM LUU FILE nhe!
    const heading = screen.getByText(/HỆ THỐNG KIỂM SOÁT AN NINH/i); 
    expect(heading).toBeInTheDocument();
  });
});
