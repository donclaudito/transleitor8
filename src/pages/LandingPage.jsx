import React from 'react';
import LandingNav from '@/components/landing/LandingNav';
import LandingHero from '@/components/landing/LandingHero';
import LandingFeatures from '@/components/landing/LandingFeatures';
import LandingModes from '@/components/landing/LandingModes';
import LandingSectors from '@/components/landing/LandingSectors';
import LandingHowItWorks from '@/components/landing/LandingHowItWorks';
import LandingStats from '@/components/landing/LandingStats';
import LandingCTA from '@/components/landing/LandingCTA';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <LandingNav />
      <LandingHero />
      <LandingFeatures />
      <LandingModes />
      <LandingSectors />
      <LandingHowItWorks />
      <LandingStats />
      <LandingCTA />
    </div>
  );
}