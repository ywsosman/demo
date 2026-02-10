import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollReveal from '../components/ScrollReveal';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
import Orb from '../components/Orb';
import OrbAmbience from '../components/OrbAmbience';
import {
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CpuChipIcon
} from '@heroicons/react/24/outline';

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      name: 'AI-Powered Diagnosis',
      description: 'Advanced machine learning algorithms analyze symptoms to provide accurate medical insights.',
      icon: CpuChipIcon,
    },
    {
      name: 'Secure & Private',
      description: 'Your medical data is encrypted and protected with the highest security standards.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Real-time Analysis',
      description: 'Get instant analysis of symptoms with confidence scores and recommendations.',
      icon: ClockIcon,
    },
    {
      name: 'Professional Review',
      description: 'Licensed doctors review AI predictions and provide professional medical guidance.',
      icon: UserGroupIcon,
    },
    {
      name: 'Comprehensive Reports',
      description: 'Detailed diagnosis reports with explanations and next steps for treatment.',
      icon: ChartBarIcon,
    },
    {
      name: 'Patient Care Focus',
      description: 'Designed to improve patient outcomes and support healthcare professionals.',
      icon: HeartIcon,
    },
  ];

  const stats = [
    { id: 1, name: 'Accuracy Rate', value: '94%', numericValue: 94, suffix: '%' },
    { id: 2, name: 'Patients Helped', value: '10,000+', numericValue: 10000, suffix: '+' },
    { id: 3, name: 'Medical Conditions', value: '200+', numericValue: 200, suffix: '+' },
    { id: 4, name: 'Partner Hospitals', value: '50+', numericValue: 50, suffix: '+' },
  ];

  return (
    <div className="relative transition-colors duration-300">
      {/* Seamless Gradient Overlay - Spans entire page for smooth color transition */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-50/20 via-30% to-cyan-100/40 to-70% dark:from-transparent dark:via-emerald-900/10 dark:via-30% dark:to-emerald-950/30 dark:to-70%"></div>
        <div className="absolute inset-0 bg-gradient-radial from-transparent from-20% via-transparent via-50% to-cyan-100/30 dark:to-gray-900/30"></div>
      </div>

      {/* Hero section */}
      <div className="relative px-4 sm:px-6 pt-16 sm:pt-20 lg:px-8 overflow-hidden">
        {/* Ambient Background */}
        <OrbAmbience />
        
        {/* Orb */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full max-w-[90vw] sm:max-w-3xl lg:max-w-4xl h-[300px] xs:h-[350px] sm:h-[550px] md:h-[600px] lg:h-[700px] opacity-40 pointer-events-auto">
            <Orb 
              hoverIntensity={0.75}
              rotateOnHover={true}
              forceHoverState={false}
            />
          </div>
        </div>
        
        <div className="relative mx-auto max-w-2xl py-20 sm:py-32 md:py-48 lg:py-56">
          <ScrollReveal direction="down" delay={100} duration={800}>
            <div className="hidden sm:mb-8 sm:flex sm:justify-center">
              <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-900 dark:text-white ring-1 ring-gray-900/10 dark:ring-gray-100/10 hover:ring-gray-900/20 dark:hover:ring-gray-100/20">
                Revolutionizing healthcare with AI.{' '}
                <a href="#features" className="font-semibold text-medical-600 dark:text-medical-400">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Learn more <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </div>
          </ScrollReveal>
          
          <div className="text-center px-2">
            <ScrollReveal direction="up" delay={200} duration={900}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-white">
                AI-Powered Medical Diagnosis System
              </h1>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={400} duration={900}>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-900 dark:text-white px-2">
                Get instant, accurate medical insights powered by advanced AI technology. 
                Trusted by healthcare professionals and patients worldwide for better health outcomes.
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={600} duration={900}>
              <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="w-full sm:w-auto rounded-md bg-medical-600 px-4 sm:px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 text-center"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="w-full sm:w-auto rounded-md bg-medical-600 px-4 sm:px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 text-center"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="w-full sm:w-auto text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 text-center py-2.5"
                    >
                      Sign in <span aria-hidden="true">→</span>
                    </Link>
                  </>
                )}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Stats section */}
      <div className="relative py-12 sm:py-16 md:py-24 lg:py-32 transition-colors duration-300">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <dl className="grid grid-cols-2 gap-4 sm:gap-6 md:gap-8 text-center lg:grid-cols-4">
            {stats.map((stat, index) => (
              <ScrollReveal 
                key={stat.id} 
                direction="up" 
                delay={index * 100}
                duration={800}
              >
                <div className="mx-auto flex max-w-xs flex-col gap-y-2 sm:gap-y-4 p-6 sm:p-8 rounded-2xl bg-white/60 dark:bg-gray-800/60 backdrop-blur-md border border-white/20 dark:border-gray-700/50 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
                  <dt className="text-xs sm:text-sm md:text-base leading-5 sm:leading-7 text-gray-800 dark:text-gray-100 font-medium">{stat.name}</dt>
                  <dd className="order-first text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm">
                    <AnimatedCounter 
                      end={stat.numericValue}
                      suffix={stat.suffix}
                      duration={2000}
                      className="inline-block"
                    />
                  </dd>
                </div>
              </ScrollReveal>
            ))}
          </dl>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="relative py-12 sm:py-16 md:py-24 lg:py-32 transition-colors duration-300 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center px-2">
            <ScrollReveal direction="up" delay={100} duration={800}>
              <h2 className="text-sm sm:text-base font-semibold leading-6 sm:leading-7 text-medical-600">Advanced Healthcare</h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={200} duration={900}>
              <p className="mt-2 text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
                Everything you need for medical diagnosis
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={300} duration={900}>
              <p className="mt-4 sm:mt-6 text-base sm:text-lg leading-7 sm:leading-8 text-gray-900 dark:text-white">
                Our comprehensive platform combines cutting-edge AI technology with medical expertise 
                to provide accurate, fast, and reliable health insights.
              </p>
            </ScrollReveal>
          </div>
          
          <div className="mx-auto mt-12 sm:mt-16 lg:mt-24 scroll-stack-container">
            <ScrollStack
              itemDistance={50}
              itemScale={0.03}
              itemStackDistance={18}
              stackPosition="18%"
              scaleEndPosition="12%"
              baseScale={0.92}
            >
              {features.map((feature) => (
                <ScrollStackItem key={feature.name}>
                  <div className="card-icon-wrapper">
                    <feature.icon className="card-icon" aria-hidden="true" />
                  </div>
                  <h3 className="card-title">{feature.name}</h3>
                  <p className="card-description">{feature.description}</p>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="relative py-12 sm:py-16 md:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <ScrollReveal direction="up" delay={100} duration={800}>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-gray-900 dark:text-white drop-shadow-sm px-4">
              Ready to experience the future of healthcare?
            </h2>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={300} duration={900}>
            <p className="mx-auto mt-4 sm:mt-6 max-w-xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-800 dark:text-gray-100 drop-shadow-sm px-4">
              Join thousands of healthcare professionals and patients who trust our AI-powered 
              medical diagnosis system for better health outcomes.
            </p>
          </ScrollReveal>
          
          <ScrollReveal direction="up" delay={500} duration={900}>
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-x-6 px-4">
              {!user && (
                <Link
                  to="/register"
                  className="w-full sm:w-auto rounded-md bg-medical-600 px-4 sm:px-3.5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-medical-500 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600 transition-all duration-200 text-center"
                >
                  Get started today
                </Link>
              )}
              <a href="#features" className="w-full sm:w-auto text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-medical-600 dark:hover:text-medical-400 transition-colors duration-200 drop-shadow-sm text-center py-2.5">
                Learn more <span aria-hidden="true">→</span>
              </a>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
};

export default Landing;
