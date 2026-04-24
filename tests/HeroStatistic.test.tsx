import { render, screen } from '@testing-library/react';
import { HeroStatistic } from '@/components/HeroStatistic';
import { NearEarthObject } from '@/types/nasa';

// Mock framer-motion to prevent animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode, className: string }) => (
      <div className={className}>{children}</div>
    ),
  },
}));

describe('HeroStatistic', () => {
  const mockSafeObject: NearEarthObject = {
    id: '1',
    name: 'Safe Asteroid',
    absolute_magnitude_h: 10,
    estimated_diameter: {
      kilometers: { estimated_diameter_min: 1, estimated_diameter_max: 2 },
      meters: { estimated_diameter_min: 1000, estimated_diameter_max: 2000 },
      miles: { estimated_diameter_min: 0.6, estimated_diameter_max: 1.2 },
      feet: { estimated_diameter_min: 3000, estimated_diameter_max: 6000 }
    },
    is_potentially_hazardous_asteroid: false,
    close_approach_data: [],
    is_sentry_object: false
  };

  const mockHazardousObject: NearEarthObject = {
    ...mockSafeObject,
    id: '2',
    name: 'Dangerous Asteroid',
    is_potentially_hazardous_asteroid: true,
  };

  it('renders 0 hazardous objects when list is empty', () => {
    render(<HeroStatistic objects={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/No imminent threats/i)).toBeInTheDocument();
  });

  it('renders correctly with safe objects', () => {
    render(<HeroStatistic objects={[mockSafeObject, mockSafeObject]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/No imminent threats/i)).toBeInTheDocument();
  });

  it('counts and displays hazardous objects correctly', () => {
    render(<HeroStatistic objects={[mockSafeObject, mockHazardousObject, mockHazardousObject]} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Elevated threat level/i)).toBeInTheDocument();
  });
});
