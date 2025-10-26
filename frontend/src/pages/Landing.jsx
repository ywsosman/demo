import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollReveal from '../components/ScrollReveal';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
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
      {/* Hero section */}
      <div className="relative px-6 pt-20 lg:px-8">
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
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
          
          <div className="text-center">
            <ScrollReveal direction="up" delay={200} duration={900}>
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                AI-Powered Medical Diagnosis System
              </h1>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={400} duration={900}>
              <p className="mt-6 text-lg leading-8 text-gray-900 dark:text-white">
                Get instant, accurate medical insights powered by advanced AI technology. 
                Trusted by healthcare professionals and patients worldwide for better health outcomes.
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={600} duration={900}>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {user ? (
                  <Link
                    to="/dashboard"
                    className="rounded-md bg-medical-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/register"
                      className="rounded-md bg-medical-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-medical-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-medical-600"
                    >
                      Get Started
                    </Link>
                    <Link
                      to="/login"
                      className="text-sm font-semibold leading-6 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200"
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
      <div className="relative py-24 sm:py-32 transition-colors duration-300">
        <div className="absolute inset-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
            {stats.map((stat, index) => (
              <ScrollReveal 
                key={stat.id} 
                direction="up" 
                delay={index * 100}
                duration={800}
              >
                <div className="mx-auto flex max-w-xs flex-col gap-y-4">
                  <dt className="text-base leading-7 text-gray-900 dark:text-white">{stat.name}</dt>
                  <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
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
      <div id="features" className="relative py-24 sm:py-32 transition-colors duration-300 overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <ScrollReveal direction="up" delay={100} duration={800}>
              <h2 className="text-base font-semibold leading-7 text-medical-600">Advanced Healthcare</h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={200} duration={900}>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything you need for medical diagnosis
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={300} duration={900}>
              <p className="mt-6 text-lg leading-8 text-gray-900 dark:text-white">
                Our comprehensive platform combines cutting-edge AI technology with medical expertise 
                to provide accurate, fast, and reliable health insights.
              </p>
            </ScrollReveal>
          </div>
          
          <div className="mx-auto mt-16 sm:mt-20 lg:mt-24 scroll-stack-container">
            <ScrollStack
              itemDistance={80}
              itemScale={0.04}
              itemStackDistance={25}
              stackPosition="20%"
              scaleEndPosition="15%"
              baseScale={0.90}
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
      <div className="relative bg-gradient-to-r from-medical-600 to-indigo-600 dark:from-medical-700 dark:to-indigo-700 backdrop-blur-sm">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <ScrollReveal direction="up" delay={100} duration={800}>
              <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Ready to experience the future of healthcare?
              </h2>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={300} duration={900}>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-medical-100">
                Join thousands of healthcare professionals and patients who trust our AI-powered 
                medical diagnosis system for better health outcomes.
              </p>
            </ScrollReveal>
            
            <ScrollReveal direction="up" delay={500} duration={900}>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {!user && (
                  <Link
                    to="/register"
                    className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-medical-600 shadow-sm hover:bg-medical-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    Get started today
                  </Link>
                )}
                <a href="#features" className="text-sm font-semibold leading-6 text-white">
                  Learn more <span aria-hidden="true">→</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
