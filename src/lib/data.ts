import type { Service } from '@/lib/types';

// This file is now used for static service data.
// Client and Invoice data are now fetched from Firestore.

export const services: Service[] = [
  { id: '1', description: 'CNC Machine Time', rate: 150, unit: 'per_hour' },
  { id: '2', description: '3D Printer Usage', rate: 45, unit: 'per_hour' },
  { id: '3', description: 'Laser Cutter Rental', rate: 80, unit: 'per_hour' },
  { id: '4', description: 'Workshop Bay Rental', rate: 500, unit: 'fixed' },
  { id: '5', description: 'Software License', rate: 25, unit: 'fixed' },
];
