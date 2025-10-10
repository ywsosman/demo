import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
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
    { id: 1, name: 'Accuracy Rate', value: '94%' },
    { id: 2, name: 'Patients Helped', value: '10,000+' },
    { id: 3, name: 'Medical Conditions', value: '200+' },
    { id: 4, name: 'Partner Hospitals', value: '50+' },
  ];

  return (
    <div className="bg-white">
      {/* Hero section */}
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>
        
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-gray-600 ring-1 ring-gray-900/10 hover:ring-gray-900/20">
              Revolutionizing healthcare with AI.{' '}
              <a href="#features" className="font-semibold text-medical-600">
                <span className="absolute inset-0" aria-hidden="true" />
                Learn more <span aria-hidden="true">&rarr;</span>
              </a>
            </div>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              AI-Powered Medical Diagnosis System
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Get instant, accurate medical insights powered by advanced AI technology. 
              Trusted by healthcare professionals and patients worldwide for better health outcomes.
            </p>
            
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
                    className="text-sm font-semibold leading-6 text-gray-900"
                  >
                    Sign in <span aria-hidden="true">→</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
        </div>
      </div>

      {/* Stats section */}
      <div className="bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-16 text-center lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.id} className="mx-auto flex max-w-xs flex-col gap-y-4">
                <dt className="text-base leading-7 text-gray-600">{stat.name}</dt>
                <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
                  {stat.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Features section */}
      <div id="features" className="bg-gray-50 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-medical-600">Advanced Healthcare</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need for medical diagnosis
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our comprehensive platform combines cutting-edge AI technology with medical expertise 
              to provide accurate, fast, and reliable health insights.
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-medical-600">
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">{feature.description}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-medical-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to experience the future of healthcare?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-medical-100">
              Join thousands of healthcare professionals and patients who trust our AI-powered 
              medical diagnosis system for better health outcomes.
            </p>
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
