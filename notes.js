// Note registry for richly structured pages: home, indexes, manifesto, contact.
// Editorial pages (projects, team profiles, partner profiles) live as markdown
// files in content/<slug>.md and are loaded at runtime by app.js. See README.md.

window.NOTES = {

  home: {
    id: 'home',
    type: 'org',
    kicker: 'home',
    title: 'a quiet factory for hard questions',
    subtitle: 'uzinaduzina is a non-profit cultural association in Cluj-Napoca, working at the intersection of art, intangible heritage, education, and critical technology. We have been asking what democracy means in the age of algorithms since 2020.',
    accent: 'indigo',
    body: [
      { kind: 'p', text: 'This site is a stack of notes, not a brochure. Click a link in any note: it opens alongside. Close it: keep going. The page is the stack.' },

      { kind: 'h2', text: 'three lines we keep pulling' },
      { kind: 'tags', items: [
        { tag: '#critical-tech', text: 'A continuous line of work on technology and democratic life since 2020: the cabinet of retrofuturist curiosities (2024), the AI4NGOs training in Cluj (2025), and the educational materials we keep producing. We are reflective about technology, not enthusiastic about it.' },
        { tag: '#european-projects', text: 'Eight Erasmus+ projects, two of them coordinated by us as lead. Being European is not a marketing claim; it is the funding architecture.' },
        { tag: '#living-heritage', text: 'Folk & cultural astronomy, traditional crafts, intangible heritage as material that does not need a glass case to stay alive. Goana după meteor (2025), Wooden Wonders (2025). The cabinet of retrofuturist curiosities (2024).' },
      ]},

      { kind: 'h2', text: 'enter through any door' },
      { kind: 'cards', items: [
        { href: 'who-we-are', label: 'who we are', sub: 'the organisation, in three lengths' },
        { href: 'manifesto', label: 'fundamentals', sub: 'nine fundamentals, each on its own page' },
        { href: 'projects', label: 'projects', sub: 'all 15 projects, lead and partner' },
        { href: 'team', label: 'team', sub: 'the people who do the work' },
        { href: 'partners', label: 'partners', sub: 'the network across Europe' },
        { href: 'curiosity-dunbar-alexander-and-the-dozen', label: 'why a dozen', sub: 'how we are organised, with a long footnote' },
      ]},

      { kind: 'h2', text: 'European network' },
      { kind: 'md', html: '<p>Working alongside CCIF Cyprus, 4 Elements Croatia, CO-LABORY Italy, Innovation Hive Greece, ACD La Hoya Spain, Udruga Murtila Croatia, and the Polish Institute Romania. The full constellation: see the <a href="?n=partners" data-note="partners">partners</a> note.</p>' },

      { kind: 'addresses', items: [
        { label: 'most recent', value: '<a href="?n=project-ai4ngos" data-note="project-ai4ngos">AI4NGOs</a> (Cluj, August 2025) · <a href="?n=project-goana-dupa-meteor" data-note="project-goana-dupa-meteor">Goana după meteor</a> (Mociu, August 2025)' },
        { label: 'last update', value: '2026-05' },
      ]},
    ],
  },

  // who-we-are now lives at content/who-we-are.md so it can carry an iframe
  // and richer markdown prose. The runtime loader resolves it.

  manifesto: {
    id: 'manifesto',
    type: 'manifesto',
    kicker: 'fundamentals',
    title: 'fundamentals',
    subtitle: 'Nine fundamentals. Not rules we set out to obey, but tendencies our work has revealed about itself, retrospectively.',
    accent: 'ochre',
    body: [
      { kind: 'lede', text: 'We name these so we can recognise them when they recur, and so we can refuse work that contradicts them. The principles are arranged to be read in sequence; each one ends by gesturing at the next, so the manifesto reads less like a list and more like a slow circuit through what we believe. You can also read them out of order; they will not collapse.' },

      { kind: 'p', text: 'We try to keep the principles independent of any particular project, so they remain useful as our work evolves. Where a principle has a natural home in something we have done, we link to it. The principle does not depend on the project; the project is one way the principle has, so far, taken shape.' },

      { kind: 'h2', text: 'the nine' },

      { kind: 'auto-list', filter: { type: 'principle' } },

      { kind: 'callout', text: 'Read in order, the manifesto loops: the ninth principle hands you back to the first. Read out of order, each principle is a self-contained essay.' },

      { kind: 'h2', text: 'read alongside' },
      { kind: 'links', items: [
        { href: 'who-we-are', label: 'who we are' },
        { href: 'projects', label: 'projects: where the principles take concrete form' },
        { href: 'project-democraicy', label: 'democraicy: an early concept document, 2020' },
      ]},
    ],
  },

  projects: {
    id: 'projects',
    type: 'org',
    kicker: 'projects',
    title: 'projects',
    subtitle: 'Roughly half a million euros coordinated as lead across the major Erasmus+ KA220 partnerships, plus international mobilities as partner and beneficiary.',
    accent: 'indigo',
    body: [
      { kind: 'lede', text: 'Sorted by what we did, not by who funded it. Click any project to open its full note alongside.' },

      { kind: 'h2', text: 'highlights' },
      { kind: 'cards', items: [
        { href: 'project-drops-sustainable-development', label: 'Drops of Sustainable Development', sub: 'KA220-ADU · €250,000 · 2024–2026 · ongoing' },
        { href: 'project-green-genesis-startup', label: 'Green Genesis Startup', sub: 'KA220-YOU · €205,144 · 2022–2024' },
        { href: 'project-goana-dupa-meteor', label: 'Goana după meteor', sub: 'AFCN · 2025 · astronomy at Mociu' },
        { href: 'project-ai4ngos', label: 'AI4NGOs', sub: 'AI in civil society · Cluj for CCIF · August 2025' },
      ]},

      { kind: 'h2', text: 'coordinated as lead' },
      { kind: 'auto-list', filter: { type: 'project', role: 'lead' } },

      { kind: 'h2', text: 'as partner or beneficiary' },
      { kind: 'auto-list', filter: { type: 'project', role: ['partner', 'beneficiary'] } },

      { kind: 'h2', text: 'the five-year line on technology and civic life' },
      { kind: 'numbered', items: [
        { n: '2020', title: 'democraicy (concept)', sub: 'An early concept document on mini-agoras for engineers, philosophers, anthropologists, artists, political scientists. Unfunded. We kept the question.' },
        { n: '2024', title: 'Cabinet of retrofuturist curiosities', sub: 'Midjourney as a tool in a school workshop, several years before that became unremarkable.' },
        { n: '2025', title: 'AI4NGOs', sub: 'A youth-worker training on AI in civil society, hosted in Cluj for CCIF Cyprus.' },
      ]},

      { kind: 'h2', text: 'read alongside' },
      { kind: 'links', items: [
        { href: 'manifesto', label: 'the fundamentals: nine texts' },
        { href: 'team', label: 'the team' },
        { href: 'partners', label: 'partners' },
      ]},
    ],
  },

  team: {
    id: 'team',
    type: 'org',
    kicker: 'team',
    title: 'team',
    subtitle: 'A deliberately small team. We scale by partnership rather than by hiring; the people listed here are the ones who carry the institutional memory.',
    accent: 'indigo',
    body: [
      { kind: 'lede', text: 'Roles are described as continuous tendencies rather than fixed job descriptions. Most of our larger projects are delivered together with European consortia and with collaborators contracted for the duration of specific activities.' },

      { kind: 'auto-list', filter: { type: 'person' } },

      { kind: 'h2', text: 'read alongside' },
      { kind: 'links', items: [
        { href: 'projects', label: 'projects: what the team has worked on' },
        { href: 'partners', label: 'partner organisations' },
        { href: 'who-we-are', label: 'who we are' },
      ]},
    ],
  },

  partners: {
    id: 'partners',
    type: 'org',
    kicker: 'partners',
    title: 'partners',
    subtitle: 'A constellation. Partners across seven countries, fifteen projects since 2020. The strongest tie is CCIF Cyprus, with five projects together.',
    accent: 'indigo',
    body: [
      { kind: 'lede', text: 'uzinaduzina sits at the centre. Partners orbit on the outer ring, sized by the number of projects together. Projects sit between centre and partners, pulled toward the people they were made with. Hover any node for details; double-click to open its note alongside.' },

      { kind: 'constellation' },

      { kind: 'h2', text: 'reading the graph' },
      { kind: 'tags', items: [
        { tag: 'colour', text: 'Indigo dots are projects we lead. Ochre dots are projects where we are partner. Green dots are projects we benefit from. The hollow rings on the outside are partner organisations.' },
        { tag: 'size', text: 'A partner ring grows with the number of projects we have done together. CCIF (Cyprus) is therefore the largest; consortium one-offs are the smallest.' },
        { tag: 'lines', text: 'Solid hairlines show that a project was made with that partner. The lines passing through the centre indicate that uzinaduzina is in every project (we are the one that made the introduction).' },
      ]},

      { kind: 'h2', text: 'read alongside' },
      { kind: 'links', items: [
        { href: 'partner-ccif', label: 'CCIF Cyprus: the strategic partner, full note' },
        { href: 'projects', label: 'all projects' },
        { href: 'project-ai4ngos', label: 'AI4NGOs: the most recent project with CCIF Cyprus' },
      ]},
    ],
  },

  contact: {
    id: 'contact',
    type: 'org',
    kicker: 'contact',
    title: 'contact',
    subtitle: 'A small list of doors. Pick one.',
    accent: 'indigo',
    body: [
      { kind: 'lede', text: 'Curious, have ideas, want to propose a consortium, want to write to us about something we got wrong? All of the above are welcome.' },

      { kind: 'h2', text: 'addresses' },
      { kind: 'addresses', items: [
        { label: 'general', value: 'contact@uzinaduzina.org' },
        { label: 'consortia & grant writing', value: 'liviu@uzinaduzina.org' },
        { label: 'location', value: 'Cluj-Napoca, Romania' },
      ]},

      { kind: 'callout', text: 'We work in Romanian and English. Drafts in either language are fine.' },

      { kind: 'h2', text: 'wander further' },
      { kind: 'links', items: [
        { href: 'manifesto', label: 'the fundamentals' },
        { href: 'projects', label: 'all projects' },
        { href: 'project-ai4ngos', label: 'AI4NGOs: AI in civil society, Cluj 2025' },
        { href: 'project-democraicy', label: 'democraicy: an early concept document, 2020' },
      ]},
    ],
  },

};
