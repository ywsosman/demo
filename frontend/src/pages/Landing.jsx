import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import AnimatedCounter from '../components/AnimatedCounter';
import ScrollReveal from '../components/ScrollReveal';
import ScrollStack, { ScrollStackItem } from '../components/ScrollStack';
import Orb from '../components/Orb';
import OrbAmbience from '../components/OrbAmbience';
import './Landing.css';
import {
  HeartIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CpuChipIcon,
  CheckBadgeIcon,
  LockClosedIcon,
  LightBulbIcon,
  InformationCircleIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const Landing = () => {
  const { user } = useAuth();

  const features = [
    {
      name: 'AI-Powered Diagnosis',
      description: 'Machine learning analyses your symptoms and surfaces likely conditions with confidence scores.',
      icon: CpuChipIcon,
    },
    {
      name: 'Secure & Private',
      description: 'Medical data is encrypted end-to-end and handled under strict privacy standards.',
      icon: ShieldCheckIcon,
    },
    {
      name: 'Real-time Analysis',
      description: 'Receive instant symptom insights, severity guidance, and actionable next steps.',
      icon: ClockIcon,
    },
    {
      name: 'Professional Review',
      description: 'Licensed doctors review AI predictions and add professional medical guidance.',
      icon: UserGroupIcon,
    },
    {
      name: 'Comprehensive Reports',
      description: 'Detailed reports with explainability charts, precautions, and treatment pathways.',
      icon: ChartBarIcon,
    },
    {
      name: 'Patient Care Focus',
      description: 'Built to support better outcomes for patients and streamline clinician workflows.',
      icon: HeartIcon,
    },
  ];

  const trustItems = [
    { icon: CpuChipIcon, label: 'AI-powered diagnosis' },
    { icon: LightBulbIcon, label: 'Explainable predictions' },
    { icon: LockClosedIcon, label: 'Secure health data' },
    { icon: CheckBadgeIcon, label: 'Doctor review workflow' },
  ];

  const stats = [
    { id: 1, name: 'Model accuracy', numericValue: 95, suffix: '%', featured: true },
    { id: 2, name: 'Conditions supported', numericValue: 41, suffix: '' },
    { id: 3, name: 'Dataset records', numericValue: 4920, suffix: '', compact: false },
    { id: 4, name: 'Symptoms indexed', numericValue: 131, suffix: '' },
  ];

  const steps = [
    {
      step: '01',
      title: 'Describe your symptoms',
      description: 'Select from the symptom list or write details in plain language.',
      icon: ClipboardDocumentListIcon,
    },
    {
      step: '02',
      title: 'AI analyses your case',
      description: 'Our fine-tuned BERT model predicts conditions with confidence and SHAP explainability.',
      icon: BeakerIcon,
    },
    {
      step: '03',
      title: 'Review & follow up',
      description: 'View reports in your dashboard while a doctor reviews the AI output.',
      icon: ArrowPathIcon,
    },
  ];

  return (
    <div className="relative transition-colors duration-300 font-sans overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#f0fdf4] via-white to-[#ecfdf5] dark:from-transparent dark:via-green-900/10 dark:to-green-950/30" />
      </div>

      {/* Hero — split layout on desktop (Framer-style) */}
      <section className="relative px-4 sm:px-6 pt-12 sm:pt-16 lg:px-8 overflow-hidden">
        <OrbAmbience />

        <div className="landing-section landing-hero-grid relative z-10 py-12 sm:py-20 lg:py-24">
          <motion.div
            initial="initial"
            animate="animate"
            variants={stagger}
            className="text-center lg:text-left"
          >
            <motion.div
              variants={fadeUp}
              className="landing-hero-badge-wrap hidden sm:flex sm:justify-center lg:justify-start mb-6"
            >
              <div className="landing-hero-badge rounded-full px-4 py-1.5 text-sm leading-6">
                AI-powered medical diagnosis for modern healthcare.{' '}
                <a href="#how-it-works" className="font-semibold">
                  See how it works <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-green-950 dark:text-white leading-[1.1]"
            >
              Smarter symptom checks,{' '}
              <span className="text-[#22a84a] dark:text-green-400">backed by AI</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl mx-auto lg:mx-0"
            >
              Get instant, explainable insights from your symptoms. Our fine-tuned model
              surfaces likely conditions with confidence scores, and clinicians can review every case.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="landing-hero-actions mt-8 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3"
            >
              {user ? (
                <Link to="/dashboard" className="landing-btn-primary w-full sm:w-auto">
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link to="/register" className="landing-btn-primary w-full sm:w-auto">
                    Get Started
                  </Link>
                  <Link to="/login" className="landing-btn-secondary w-full sm:w-auto">
                    Sign in <span aria-hidden="true">&rarr;</span>
                  </Link>
                </>
              )}
            </motion.div>

            <motion.div variants={fadeUp} className="landing-trust-pills">
              {trustItems.map((item) => (
                <span key={item.label} className="landing-trust-pill">
                  <item.icon aria-hidden />
                  {item.label}
                </span>
              ))}
            </motion.div>
          </motion.div>

          <div className="landing-hero-visual">
            <div className="absolute inset-0 flex items-center justify-center opacity-50 dark:opacity-60">
              <div className="w-full h-full max-h-[480px] pointer-events-auto">
                <Orb hoverIntensity={0.75} rotateOnHover={true} forceHoverState={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile orb behind hero text */}
        <div className="lg:hidden absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
          <div className="w-full max-w-md h-[280px]">
            <Orb hoverIntensity={0.5} rotateOnHover={false} forceHoverState={false} />
          </div>
        </div>
      </section>

      {/* Bento metrics */}
      <section id="metrics" className="relative py-16 sm:py-24">
        <div className="landing-section">
          <ScrollReveal direction="up" delay={80} duration={700}>
            <div className="text-center mb-10">
              <p className="landing-section-label">Platform metrics</p>
              <h2 className="landing-section-title landing-section-desc--center mx-auto">
                Built on proven ML
              </h2>
              <p className="landing-section-desc landing-section-desc--center mt-3">
                Trained on thousands of symptom records with explainable AI you can trust.
              </p>
            </div>
          </ScrollReveal>

          <div className="landing-bento-metrics">
            {stats.map((stat, index) => (
              <ScrollReveal
                key={stat.id}
                direction="up"
                delay={index * 60}
                duration={600}
                className={stat.featured ? 'landing-bento-stat-wrap--featured h-full' : 'h-full'}
              >
                <div
                  className={`landing-bento-stat h-full ${stat.featured ? 'landing-bento-stat--featured' : ''}`}
                >
                  <div className="landing-bento-stat-value">
                    <AnimatedCounter
                      end={stat.numericValue}
                      suffix={stat.suffix}
                      compact={stat.compact !== false}
                      duration={2000}
                    />
                  </div>
                  <p className="landing-bento-stat-label">{stat.name}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal direction="up" delay={300} duration={700}>
            <p className="landing-disclaimer" role="note">
              <InformationCircleIcon aria-hidden />
              <span>
                <strong>Academic demonstration.</strong> Not validated for clinical use, regulatory
                approval, or real-world patient care.
              </span>
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative py-16 sm:py-24 border-t border-slate-200/80 dark:border-slate-700/50">
        <div className="landing-section">
          <ScrollReveal direction="up" delay={80} duration={700}>
            <div className="text-center mb-10">
              <p className="landing-section-label">How it works</p>
              <h2 className="landing-section-title landing-section-desc--center mx-auto">
                Three steps to clearer insights
              </h2>
            </div>
          </ScrollReveal>

          <div className="landing-steps">
            {steps.map((item, index) => (
              <ScrollReveal key={item.step} direction="up" delay={index * 80} duration={600}>
                <article className="landing-step-card h-full">
                  <span className="landing-step-number">{item.step}</span>
                  <h3 className="landing-step-title">{item.title}</h3>
                  <p className="landing-step-desc">{item.description}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features — bento grid (mobile/tablet) + scroll stack (desktop) */}
      <section id="features" className="relative py-16 sm:py-24">
        <div className="landing-section">
          <ScrollReveal direction="up" delay={100} duration={700}>
            <div className="text-center mb-10 lg:mb-14">
              <p className="landing-section-label">Platform capabilities</p>
              <h2 className="landing-section-title landing-section-desc--center mx-auto">
                Everything you need for informed care
              </h2>
              <p className="landing-section-desc landing-section-desc--center mt-3">
                Cutting-edge AI paired with clinical oversight — accurate, fast, and built for
                real-world healthcare workflows.
              </p>
            </div>
          </ScrollReveal>

          {/* Bento feature grid — inspired by Framer layout marketplace */}
          <div className="landing-bento-features mb-4">
            {features.map((feature, index) => (
              <ScrollReveal key={feature.name} direction="up" delay={index * 50} duration={500}>
                <article className="landing-bento-feature h-full">
                  <div className="landing-bento-feature-icon">
                    <feature.icon aria-hidden />
                  </div>
                  <h3 className="landing-bento-feature-title">{feature.name}</h3>
                  <p className="landing-bento-feature-desc">{feature.description}</p>
                </article>
              </ScrollReveal>
            ))}
          </div>

          {/* Immersive scroll stack on large screens */}
          <div className="landing-scroll-stack-wrap">
            <ScrollStack>
              {features.map((feature) => (
                <ScrollStackItem key={feature.name}>
                  <div className="stack-card-icon-wrapper">
                    <feature.icon className="stack-card-icon" aria-hidden="true" />
                  </div>
                  <h3 className="stack-card-title">{feature.name}</h3>
                  <p className="stack-card-description">{feature.description}</p>
                </ScrollStackItem>
              ))}
            </ScrollStack>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="landing-section max-w-2xl">
          <div className="landing-cta-panel">
            <ScrollReveal direction="up" delay={100} duration={700}>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-green-950 dark:text-white">
                Ready to experience smarter healthcare?
              </h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={200} duration={700}>
              <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-300">
                Create an account to check symptoms, view AI explanations, and follow
                cases through the patient and doctor dashboards.
              </p>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={300} duration={700}>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                {!user && (
                  <Link to="/register" className="landing-btn-primary w-full sm:w-auto">
                    Get started today
                  </Link>
                )}
                <a href="#features" className="landing-btn-secondary w-full sm:w-auto">
                  Explore features <span aria-hidden="true">&rarr;</span>
                </a>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
