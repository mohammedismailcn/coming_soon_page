import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Check, ShieldCheck, Sparkles, Timer, Verified } from "lucide-react";
import { HeroNetwork } from "./HeroNetwork";

const XIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l11.733 16h4.267l-11.733 -16z" />
    <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" />
  </svg>
);

const FacebookIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

const InstagramIcon = ({ size = 24 }: { size?: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);

const highlights = [
  { title: "Verified Listings", copy: "Trust-first connected ecosystem.", icon: Verified },
  { title: "Smart Matching", copy: "Intent-aware discovery.", icon: Sparkles },
  { title: "Market Signals", copy: "Optimized opportunity tracking.", icon: Timer },
  { title: "Secure Transactions", copy: "Calmer, structured deal flows.", icon: ShieldCheck },
];

const reveal = {
  hidden: { opacity: 0, y: 18, filter: "blur(10px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)" },
};

export function App() {
  const [submitted, setSubmitted] = useState(false);
  const [networkReady, setNetworkReady] = useState(false);

  return (
    <main className="app-shell">
      <HeroNetwork onReady={() => setNetworkReady(true)} />
      <div className="scene-shade" aria-hidden="true" />
      <div className="scene-vignette" aria-hidden="true" />

      <motion.section
        className="hero-content"
        aria-label="Properdeal coming soon"
        initial="hidden"
        animate={networkReady ? "visible" : "hidden"}
        transition={{ staggerChildren: 0.16 }}
      >
        <motion.div className="brand-lockup" variants={reveal} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <img src="/assets/properdeal-logo.png" alt="Properdeal" />
        </motion.div>

        <motion.div className="social-links top-social" variants={reveal} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
            <FacebookIcon size={22} />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
            <XIcon size={22} />
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
            <InstagramIcon size={22} />
          </a>
        </motion.div>
        <motion.h1 variants={reveal} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}>Connected property deals.</motion.h1>
        <motion.p className="lead" variants={reveal} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
          A cinematic ecosystem connecting verified real estate opportunities.
        </motion.p>

        <motion.form
          className="notify-panel"
          variants={reveal}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onSubmit={(event) => {
            event.preventDefault();
            setSubmitted(true);
          }}
        >
          {!submitted ? (
            <>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input id="email" name="email" type="email" placeholder="your@email.com" autoComplete="email" required />
              <button type="submit"><Bell size={18} aria-hidden="true" /> Notify me</button>
            </>
          ) : (
            <p className="success-message"><Check size={18} aria-hidden="true" /> You're on the list.</p>
          )}
        </motion.form>

        <motion.button
          className="explore-link"
          type="button"
          variants={reveal}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => document.querySelector(".highlights")?.scrollIntoView({ behavior: "smooth" })}
        >
          Explore the ecosystem <ArrowRight size={17} aria-hidden="true" />
        </motion.button>
      </motion.section>

      <section className="highlights" aria-label="What Properdeal is building">
        <div className="section-inner">
          {highlights.map((item) => {
            const Icon = item.icon;
            return (
              <article className="highlight-card" key={item.title}>
                <Icon size={24} aria-hidden="true" />
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="footer-status">
        <p className="status-badge"><span className="status-dot"></span> Currently Updating</p>
        <h2>The full Properdeal experience is coming soon.</h2>
        <p>We are actively building the next generation of real estate technology. Check back shortly for updates.</p>

      </footer>
    </main>
  );
}