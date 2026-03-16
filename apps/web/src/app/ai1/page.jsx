export const metadata = {
  title: "AI I Clicker Showcase | The Shard",
};

const projects = [
  {
    title: "Brennan Pacheco – Dark Triad Clicker",
    student: "Brennan Pacheco",
    link: "/ai1/brennan-dark-triad-clicker.html",
    blurb: "Psych-profile inspired clicker where each trait powers different upgrades.",
  },
  {
    title: "Athas Michael – Oil Clicker",
    student: "Athas Michael",
    link: "/ai1/athas-oil-clicker.html",
    blurb: "Idle economy that explores scarcity, geopolitics, and resource ethics.",
  },
  {
    title: "Sitaparadarshan – Systems Preview",
    student: "Sitaparadarshan",
    link: "/ai1/sitaparadarshan-preview.html",
    blurb: "Proof-of-concept UI for narrative-driven clicker decisions.",
  },
  {
    title: "Shekhar Aj – Cosmic Preview",
    student: "Shekhar Aj",
    link: "/ai1/shekharaj-preview.html",
    blurb: "Lightweight demo showing progression pacing + art direction tests.",
  },
  {
    title: "Moreno Dean – Systems Preview",
    student: "Moreno Dean",
    link: "/ai1/morenodean-preview.html",
    blurb: "Interface exploration for risk/reward loops and audience onboarding.",
  },
  {
    title: "Corinne Decorte – Rooted Futures",
    student: "Corinne Decorte",
    link: "/ai1/decortecorinne-index.html",
    blurb: "Botanical clicker where plant health mirrors climate policy choices.",
  },
  {
    title: "Anay Desai – Empire Idle",
    student: "Anay Desai",
    link: "/ai1/desaianay-empire-idle.html",
    blurb: "Historical empire sim with escalating choices around ethics + labor.",
  },
  {
    title: "Oscar Cunningham – Space Invader Clicker",
    student: "Oscar Cunningham",
    link: "/ai1/cunninghamoscar-space-invader.html",
    blurb: "Mash-up of arcade play + clicker mechanics for rapid difficulty tuning.",
  },
  {
    title: "Liam O'Connor – Dig Game",
    student: "Liam O'Connor",
    link: "/ai1/oconnorliam-dig-game.html",
    blurb: "Resource-mining clicker that visualizes layers, fossils, and payouts.",
  },
  {
    title: "Maya Laurence – Star Clicker",
    student: "Maya Laurence",
    link: "/ai1/laurencemaya-star-clicker.html",
    blurb: "Celestial clicker focusing on poetic storytelling and ambient pacing.",
  },
];

export default function AI1ShowcasePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-5xl mx-auto px-6 py-12 font-inter">
        <p className="text-sm uppercase tracking-[0.3em] text-[#2563FF] mb-3">
          DES 125 · Artificial Intelligence I
        </p>
        <h1 className="text-4xl font-semibold text-[#1E1E1E] mb-4">
          Clicker Game Showcase
        </h1>
        <p className="text-lg text-[#4C4C4C] max-w-3xl">
          A rotating gallery of student-built systems explorations. Every link
          opens the raw build so you can see the exact interactions, pacing
          tests, and UI decisions they presented in critique.
        </p>

        <div className="grid gap-6 mt-10 md:grid-cols-2">
          {projects.map((project) => (
            <a
              key={project.link}
              href={project.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-2xl border border-[#E3E8FF] bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="text-xs uppercase tracking-[0.25em] text-[#94A3FF] mb-2">
                {project.student}
              </div>
              <h2 className="text-xl font-semibold text-[#1E1E1E] mb-2 group-hover:text-[#2563FF]">
                {project.title}
              </h2>
              <p className="text-sm text-[#5C5C5C] leading-relaxed">
                {project.blurb}
              </p>
              <span className="inline-flex items-center gap-2 text-[#2563FF] text-sm font-medium mt-4">
                Launch build →
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
