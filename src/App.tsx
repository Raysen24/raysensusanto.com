import { useEffect, useRef, useState, type CSSProperties } from "react"
import ParticleDrift from "./components/ParticleDrift"
import ParticlePortrait from "./components/ParticlePortrait"
import Lizard from "./components/Lizard"
import Viz from "./components/Viz"
import { VIZ } from "./viz"
import { PALETTES, readStoredTheme, storeTheme, type Theme } from "./theme"
import { profile, stats, experience, projects, education, skills, leadership } from "./data/cv"

const PHOTO_EXT = "jpg"

/* ------------------------------------------------------------------ hooks */

function useScrolled(threshold = 24) {
    const [scrolled, setScrolled] = useState(false)
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > threshold)
        onScroll()
        window.addEventListener("scroll", onScroll, { passive: true })
        return () => window.removeEventListener("scroll", onScroll)
    }, [threshold])
    return scrolled
}

function useReveal() {
    useEffect(() => {
        const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
        if (!("IntersectionObserver" in window)) {
            els.forEach((el) => el.classList.add("in"))
            return
        }
        const io = new IntersectionObserver(
            (entries) => {
                for (const e of entries) {
                    if (e.isIntersecting) {
                        e.target.classList.add("in")
                        io.unobserve(e.target)
                    }
                }
            },
            { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
        )
        els.forEach((el) => io.observe(el))
        return () => io.disconnect()
    }, [])
}

function useMedia(query: string) {
    const [match, setMatch] = useState(() => (typeof window !== "undefined" ? window.matchMedia(query).matches : false))
    useEffect(() => {
        const mq = window.matchMedia(query)
        const on = () => setMatch(mq.matches)
        on()
        mq.addEventListener("change", on)
        return () => mq.removeEventListener("change", on)
    }, [query])
    return match
}

function useTheme(): [Theme, () => void] {
    const [theme, setTheme] = useState<Theme>(() => {
        const stored = readStoredTheme()
        if (stored) return stored
        return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
    })
    useEffect(() => {
        document.documentElement.dataset.theme = theme
        const meta = document.querySelector('meta[name="theme-color"]')
        if (meta) meta.setAttribute("content", PALETTES[theme].bg)
    }, [theme])
    const toggle = () => setTheme((t) => { const n = t === "dark" ? "light" : "dark"; storeTheme(n); return n })
    return [theme, toggle]
}

/* ------------------------------------------------------------------ icons */

const Icon = {
    arrow: () => (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M9 7h8v8" />
        </svg>
    ),
    spark: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z" />
        </svg>
    ),
    check: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
        </svg>
    ),
    award: () => (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="5" /><path d="M8.5 12.5L7 22l5-3 5 3-1.5-9.5" />
        </svg>
    ),
    camera: () => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" />
        </svg>
    ),
    sun: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
    ),
    moon: () => (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
    ),
}

/* ------------------------------------------------------------------ nav */

const NAV = [
    ["About", "#about"],
    ["Experience", "#experience"],
    ["Work", "#work"],
    ["Education", "#education"],
    ["Skills", "#skills"],
    ["Contact", "#contact"],
] as const

interface NavProps {
    theme: Theme
    onToggleTheme: () => void
    lizardOn: boolean
    showLizardToggle: boolean
    onToggleLizard: () => void
}

function Nav({ theme, onToggleTheme, lizardOn, showLizardToggle, onToggleLizard }: NavProps) {
    const scrolled = useScrolled()
    return (
        <header className={"nav" + (scrolled ? " is-scrolled" : "")}>
            <div className="wrap nav-inner">
                <a href="#top" className="brand" aria-label="Back to top">
                    <span className="brand-dot" />
                    {profile.shortName}
                </a>
                <nav className="nav-links" aria-label="Sections">
                    {NAV.map(([label, href]) => (
                        <a key={href} href={href}>{label}</a>
                    ))}
                </nav>
                <div className="nav-actions">
                    {showLizardToggle && (
                        <button
                            type="button"
                            className={"toggle" + (lizardOn ? " is-on" : "")}
                            onClick={onToggleLizard}
                            aria-pressed={lizardOn}
                            title="Toggle the creature that follows your cursor"
                        >
                            <span className="toggle-pill" />
                            <span className="toggle-label">Creature</span>
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-sm btn-icon"
                        onClick={onToggleTheme}
                        aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                        title={theme === "dark" ? "Light theme" : "Dark theme"}
                    >
                        {theme === "dark" ? <Icon.sun /> : <Icon.moon />}
                    </button>
                    <a className="btn btn-sm btn-primary" href={profile.linkedin} target="_blank" rel="noreferrer">
                        LinkedIn <Icon.arrow />
                    </a>
                </div>
            </div>
        </header>
    )
}

/* ------------------------------------------------------------------ hero */

function Hero({ theme }: { theme: Theme }) {
    const narrow = useMedia("(max-width: 768px)")
    return (
        <section className="hero" id="top">
            <div className="hero-big" aria-hidden="true">
                HELLO, I&apos;M<br className="mobile-br" /> RAYSEN
            </div>

            <div className="wrap hero-stage">
                <div className="portrait-wrap">
                    <div className="portrait-glow" aria-hidden="true" />
                    <ParticlePortrait src="/raysen.png" mode={theme} step={narrow ? 3 : 2} className="portrait" />
                </div>

                <div className="hero-copy">
                    <div className="hero-eyebrow" data-reveal>
                        <span className="status-dot" />
                        <span>{profile.role}</span>
                        <span className="sep" aria-hidden="true">·</span>
                        <span className="loc">{profile.location}</span>
                    </div>
                    <h1 className="hero-title" data-reveal style={{ "--d": "80ms" } as CSSProperties}>
                        Raysen <span className="thin">Susanto</span>
                    </h1>
                    <p className="hero-sub" data-reveal style={{ "--d": "160ms" } as CSSProperties}>
                        {profile.tagline} Currently building computer-vision and ML products for last-mile
                        logistics at Shopee Express.
                    </p>
                    <div className="hero-cta" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
                        <a className="btn btn-primary" href="#work">See the work <Icon.arrow /></a>
                        <a className="btn" href="#contact">Get in touch</a>
                    </div>
                </div>
            </div>

            <div className="scroll-hint" aria-hidden="true">
                <span>Scroll</span>
                <span className="scroll-hint-line" />
            </div>
        </section>
    )
}

function StatsStrip() {
    return (
        <section className="stats-strip">
            <div className="wrap">
                <div className="hero-stats" data-reveal>
                    {stats.map((s) => (
                        <div className="stat" key={s.label}>
                            <div className="stat-kicker">{s.kicker}</div>
                            <div className="stat-value">{s.value}</div>
                            <div className="stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

/* ------------------------------------------------------------------ marquee */

function Marquee() {
    const items = [...skills.technical.slice(0, 9), "AI Product Management", "Computer Vision", "Automation", "Last-mile Logistics"]
    const doubled = [...items, ...items]
    return (
        <div className="marquee" aria-hidden="true">
            <div className="marquee-track">
                {doubled.map((t, i) => (
                    <span className="marquee-item" key={i}>{t}</span>
                ))}
            </div>
        </div>
    )
}

/* ------------------------------------------------------------------ sections */

function SectionHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
    return (
        <div className="section-head">
            <div data-reveal>
                <span className="eyebrow">{eyebrow}</span>
                <h2 className="section-title">{title}</h2>
            </div>
            {lede && <p className="section-lede" data-reveal style={{ "--d": "100ms" } as CSSProperties}>{lede}</p>}
        </div>
    )
}

function About() {
    return (
        <section className="section" id="about">
            <div className="wrap">
                <SectionHead eyebrow="01 — About" title="Product sense with an engineer's hands." />
                <div className="about-grid">
                    <div data-reveal>
                        <p className="about-text">
                            I work at the seam between operations, data and software: finding where hours are being
                            lost, framing the AI or automation product that removes them, and shipping it.
                        </p>
                        <p className="about-text">{profile.summary}</p>
                    </div>
                    <div className="facts" data-reveal style={{ "--d": "120ms" } as CSSProperties}>
                        <div className="fact"><span className="fact-k">Currently</span><span className="fact-v">AI Product Manager, Shopee Express (SPX)</span></div>
                        <div className="fact"><span className="fact-k">Based in</span><span className="fact-v">{profile.location}</span></div>
                        <div className="fact"><span className="fact-k">Education</span><span className="fact-v">Double degree: Software Engineering + Business Information Systems</span></div>
                        <div className="fact"><span className="fact-k">Languages</span><span className="fact-v">{skills.languages.join(" · ")}</span></div>
                        <div className="fact"><span className="fact-k">Open to</span><span className="fact-v">{profile.availability}</span></div>
                    </div>
                </div>
            </div>
        </section>
    )
}

/** A photo slot that shows the image when the file exists, otherwise a labelled placeholder. */
function PhotoSlot({ src, hint, alt }: { src: string; hint: string; alt: string }) {
    const [ok, setOk] = useState(true)
    return (
        <figure className={"shot" + (ok ? "" : " is-empty")}>
            {ok ? (
                <img src={src} alt={alt} loading="lazy" onError={() => setOk(false)} />
            ) : (
                <div className="shot-placeholder">
                    <Icon.camera />
                    <span>Add photo</span>
                    <code>{hint}</code>
                </div>
            )}
        </figure>
    )
}

function Experience({ theme }: { theme: Theme }) {
    const palette = PALETTES[theme]
    return (
        <section className="section" id="experience">
            <div className="wrap">
                <SectionHead
                    eyebrow="02 — Experience"
                    title="Where I have shipped."
                    lede="Four roles across logistics, fintech, EdTech and teaching. Every bullet is an outcome, not a responsibility. Hover the visuals."
                />
                <div className="timeline">
                    {experience.map((xp, i) => {
                        const slots = xp.photoSlots ?? 3
                        return (
                            <article className="xp" key={xp.company + xp.period} data-reveal style={{ "--d": `${i * 60}ms` } as CSSProperties}>
                                <div className="xp-meta">
                                    <span className="xp-period">{xp.period}</span>
                                    <span className="xp-company">{xp.company}</span>
                                    <span className="xp-loc">{xp.location}</span>
                                    {xp.current && <span className="xp-current">● Current</span>}
                                </div>
                                <div className="xp-body">
                                    <h3 className="xp-role">{xp.role}</h3>
                                    {xp.type && <p className="xp-type">{xp.type}</p>}
                                    <ul className="xp-bullets">
                                        {xp.bullets.map((b) => <li key={b}>{b}</li>)}
                                    </ul>
                                    <div className="tags">
                                        {xp.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
                                    </div>
                                </div>
                                <div className="xp-viz">
                                    <Viz draw={VIZ[xp.viz]} palette={palette} brand={xp.brand} ratio={16 / 10} />
                                </div>
                                <div className="photo-strip" style={{ gridTemplateColumns: `repeat(${Math.max(2, Math.min(3, slots))}, 1fr)` }}>
                                    {Array.from({ length: slots }, (_, n) => {
                                        const file = `photos/${xp.slug}-${n + 1}.${PHOTO_EXT}`
                                        return <PhotoSlot key={file} src={"/" + file} hint={file} alt={`${xp.company} photo ${n + 1}`} />
                                    })}
                                </div>
                            </article>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}

function ProjectCard({ p, index, theme }: { p: (typeof projects)[number]; index: number; theme: Theme }) {
    const ref = useRef<HTMLElement>(null)
    const onMove = (e: React.MouseEvent) => {
        const el = ref.current
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty("--mx", `${e.clientX - r.left}px`)
        el.style.setProperty("--my", `${e.clientY - r.top}px`)
    }
    return (
        <article
            ref={ref}
            className={"project" + (p.featured ? " is-featured" : "")}
            onMouseMove={onMove}
            data-reveal
            style={{ "--d": `${(index % 3) * 70}ms` } as CSSProperties}
        >
            <div className="project-viz">
                <Viz draw={VIZ[p.viz]} palette={PALETTES[theme]} brand={p.brand} ratio={16 / 9} />
            </div>
            <div className="project-body">
                <div className="project-top">
                    <span className="project-kind">{p.kind}</span>
                    <span className="project-period">{p.period}</span>
                </div>
                <div>
                    <h3 className="project-title">{p.title}</h3>
                    {p.org && <p className="project-org">{p.org}</p>}
                </div>
                <p className="project-summary">{p.summary}</p>
                <div className="tags">
                    {p.stack.map((t) => <span className="tag" key={t}>{t}</span>)}
                </div>
                <div className="project-impact"><Icon.spark />{p.impact}</div>
            </div>
        </article>
    )
}

function Work({ theme }: { theme: Theme }) {
    return (
        <section className="section" id="work">
            <div className="wrap">
                <SectionHead
                    eyebrow="03 — Selected work"
                    title="Products that changed how a team works."
                    lede="AI systems in production, ML models in flight, and the earlier builds that taught me to measure everything. Each card runs a live model of what it did."
                />
                <div className="projects">
                    {projects.map((p, i) => <ProjectCard p={p} index={i} theme={theme} key={p.title} />)}
                </div>
            </div>
        </section>
    )
}

function Education() {
    return (
        <section className="section" id="education">
            <div className="wrap">
                <SectionHead eyebrow="04 — Education" title="Two degrees, one GPA." lede="A double-degree programme completed in parallel across Melbourne and Jakarta." />
                <div className="edu-grid">
                    {education.map((e, i) => (
                        <article className="edu" key={e.school} data-reveal style={{ "--d": `${i * 80}ms` } as CSSProperties}>
                            <div className="edu-head">
                                <div>
                                    <h3 className="edu-school">{e.school}</h3>
                                    <p className="edu-degree">{e.degree}</p>
                                </div>
                                <div className="edu-gpa">{e.gpa.split(" ")[0]}<small>GPA / 4.00</small></div>
                            </div>
                            <div className="edu-meta"><span>{e.period}</span><span>{e.location}</span></div>
                            <div className="edu-award"><Icon.award />{e.award}</div>
                            <div className="chips">
                                {e.coursework.map((c) => <span className="chip" key={c}>{c}</span>)}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Skills() {
    return (
        <section className="section" id="skills">
            <div className="wrap">
                <SectionHead eyebrow="05 — Skills" title="Toolkit." />
                <div className="skills-grid">
                    <div className="skill-group" data-reveal>
                        <h3>Technical <span>{skills.technical.length}</span></h3>
                        <div className="chips">{skills.technical.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
                    </div>
                    <div className="skill-group" data-reveal style={{ "--d": "80ms" } as CSSProperties}>
                        <h3>Functional <span>{skills.functional.length}</span></h3>
                        <div className="chips">{skills.functional.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
                    </div>
                    <div className="skill-group" data-reveal style={{ "--d": "160ms" } as CSSProperties}>
                        <h3>Certifications <span>{skills.certifications.length}</span></h3>
                        <ul className="cert-list">{skills.certifications.map((c) => <li key={c}><Icon.check />{c}</li>)}</ul>
                    </div>
                    <div className="skill-group" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
                        <h3>Interests</h3>
                        <div className="chips">{skills.interests.map((s) => <span className="chip" key={s}>{s}</span>)}</div>
                    </div>
                </div>
            </div>
        </section>
    )
}

function Leadership() {
    return (
        <section className="section" id="leadership">
            <div className="wrap">
                <SectionHead eyebrow="06 — Leadership" title="Communities I have led." />
                <div className="lead-grid">
                    {leadership.map((l, i) => (
                        <article className="lead" key={l.org} data-reveal style={{ "--d": `${i * 80}ms` } as CSSProperties}>
                            <span className="lead-period">{l.period}</span>
                            <h3 className="lead-org">{l.org}</h3>
                            <p className="lead-role">{l.role} · {l.location}</p>
                            <ul className="xp-bullets">{l.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                        </article>
                    ))}
                </div>
            </div>
        </section>
    )
}

function Contact() {
    return (
        <section className="contact" id="contact">
            <div className="contact-glow" />
            <div className="wrap contact-inner">
                <span className="eyebrow" data-reveal>07 — Contact</span>
                <h2 className="contact-title" data-reveal style={{ "--d": "80ms" } as CSSProperties}>
                    Let&apos;s build<br />
                    <a href={profile.linkedin} target="_blank" rel="noreferrer">something useful.</a>
                </h2>
                <p className="contact-sub" data-reveal style={{ "--d": "160ms" } as CSSProperties}>
                    {profile.availability}. Reach me on LinkedIn.
                </p>
                <div className="contact-links" data-reveal style={{ "--d": "240ms" } as CSSProperties}>
                    <a className="btn btn-primary" href={profile.linkedin} target="_blank" rel="noreferrer">Message me on LinkedIn <Icon.arrow /></a>
                </div>
            </div>
        </section>
    )
}

function Footer() {
    return (
        <footer className="footer">
            <div className="wrap footer-inner">
                <span>© {new Date().getFullYear()} {profile.name}</span>
                <span>
                    Particle field by Originkit · Creature by Tyler Jones ·{" "}
                    <a href="#top">Back to top ↑</a>
                </span>
            </div>
        </footer>
    )
}

/* ------------------------------------------------------------------ app */

const LIZARD_KEY = "raysen.lizard"

export default function App() {
    useReveal()
    const [theme, toggleTheme] = useTheme()
    const palette = PALETTES[theme]
    const canHover = useMedia("(hover: hover) and (pointer: fine)")
    const reduced = useMedia("(prefers-reduced-motion: reduce)")
    const narrow = useMedia("(max-width: 768px)")

    const [lizardOn, setLizardOn] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem(LIZARD_KEY)
            if (saved !== null) return saved === "1"
        } catch {}
        return true
    })
    const toggleLizard = () => {
        setLizardOn((v) => {
            try { localStorage.setItem(LIZARD_KEY, v ? "0" : "1") } catch {}
            return !v
        })
    }

    // The creature chases a cursor, so it only makes sense on hover devices,
    // and it stays off for people who asked for reduced motion.
    const showLizard = canHover && !reduced

    return (
        <>
            {/* Site-wide particle field, fixed behind every section */}
            <div className="bg-field" aria-hidden="true">
                <ParticleDrift
                    background="transparent"
                    baseColor={palette.particleBase}
                    accentColor={palette.particleAccent}
                    density={narrow ? 110 : 300}
                    dotSize={narrow ? 3 : 4}
                    speed={reduced ? 0 : 38}
                    direction={0}
                    hover={180}
                    linkDistance={narrow ? 120 : 170}
                    linkThickness={1}
                />
                <div className="bg-vignette" />
            </div>

            <Nav
                theme={theme}
                onToggleTheme={toggleTheme}
                lizardOn={showLizard && lizardOn}
                showLizardToggle={showLizard}
                onToggleLizard={toggleLizard}
            />
            {showLizard && <Lizard enabled={lizardOn} color={palette.lizard} alpha={theme === "dark" ? 0.75 : 0.6} />}
            <main className="page">
                <Hero theme={theme} />
                <StatsStrip />
                <Marquee />
                <About />
                <Experience theme={theme} />
                <Work theme={theme} />
                <Education />
                <Skills />
                <Leadership />
                <Contact />
            </main>
            <Footer />
        </>
    )
}
