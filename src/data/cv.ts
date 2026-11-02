// Single source of truth for everything shown on the site.
// Edit this file to update the portfolio; no component changes required.
// Impact statements are deliberately qualitative: no figures are published here.
import type { VizName } from "../viz"

export const profile = {
    name: "Raysen Susanto",
    shortName: "Raysen",
    role: "AI Product Manager & Software Engineer",
    tagline: "I ship AI products that remove real hours from real operations.",
    summary:
        "AI Product Manager at Shopee Express (SPX) with a software-engineering core: I take ambiguous operational problems, turn them into AI and automation products, and carry them from user research through production. Double degree in Software Engineering (La Trobe) and Business Information Systems (Binus), both with the highest honours.",
    location: "Jakarta, Indonesia",
    linkedin: "https://linkedin.com/in/raysen/",
    availability: "Open to AI product, product engineering and consulting roles",
}

export const stats = [
    {
        kicker: "Education · Melbourne + Jakarta",
        value: "3.96 GPA",
        label: "Double degree: Computer Science (Software Engineering) at La Trobe University and Business Information Systems at Binus International University. Highest Achieving Student and Summa Cum Laude.",
    },
    {
        kicker: "Logistics · Full time",
        value: "Shopee",
        label: "AI Product Manager at SPX (Shopee Express), the logistics arm. Computer-vision and ML products for last-mile delivery, with stakeholders in Indonesia, Singapore and Shenzhen.",
    },
    {
        kicker: "EdTech · Singapore",
        value: "Kitesense",
        label: "Product Research Analyst & Management Intern. QA and research for an AI learning platform ahead of a national rollout with Temasek Polytechnic and South West CDC.",
    },
    {
        kicker: "Fintech · Jakarta",
        value: "DANA",
        label: "Automation Product Developer Intern at one of Indonesia's largest digital wallets. Re-engineered settlement operations with n8n, MCP and RPA workflows.",
    },
]

export interface Experience {
    company: string
    role: string
    type?: string
    location: string
    period: string
    current?: boolean
    bullets: string[]
    tags: string[]
    /** which animation to show beside the role */
    viz: VizName
    /** brand colour used by the animation */
    brand: string
    /** photos load from /public/photos/<slug>-1.jpg, -2.jpg, -3.jpg */
    slug: string
    photoSlots?: number
}

export const experience: Experience[] = [
    {
        company: "Shopee – SPX (Shopee Express)",
        role: "AI Product Manager",
        type: "Junior Associate · Full time",
        location: "Jakarta, Indonesia",
        period: "Apr 2026 – Present",
        current: true,
        bullets: [
            "Led end-to-end development of an AI-powered driver video validation system, from user research and requirement gathering through production delivery, retiring a manual review queue and returning a substantial share of review hours and cost to operations every month.",
            "Driving ML-based final-pin accuracy improvement for SPX Indonesia (gradient boosting classifier, batch confirmation detector, Bayesian pin fusion), enriching pin data with ShopeeFood buyer-interaction signals to cut parcel misrouting from incorrect-zone pins.",
            "Managing a portfolio of products and enhancements across AI automation and last-mile optimization teams, with stakeholders across Indonesia, Singapore and Shenzhen.",
        ],
        tags: ["AI Product", "Computer Vision", "ML", "Last-mile Ops", "Stakeholder Mgmt"],
        viz: "lastMile",
        brand: "#EE4D2D",
        slug: "spx",
        photoSlots: 2,
    },
    {
        company: "Kitesense",
        role: "Product Research Analyst & Management Intern",
        location: "Singapore",
        period: "Dec 2025 – Apr 2026",
        bullets: [
            "Designed and executed an extensive cross-platform test suite ahead of a national rollout delivered with Temasek Polytechnic and South West CDC, materially lowering the defect rate.",
            "Identified and documented AI worksheet misalignments across subjects, driving a marked improvement in topic accuracy across key sub-strands.",
            "Delivered PRDs, oral assessment rubrics and a multi-module go-to-market research framework covering curriculum analysis across subjects and schools.",
        ],
        tags: ["EdTech", "Product Research", "QA", "PRDs", "GTM"],
        viz: "qualityGate",
        brand: "#14B8A6",
        slug: "kitesense",
        photoSlots: 1,
    },
    {
        company: "DANA Indonesia",
        role: "Automation Product Developer Intern",
        location: "Jakarta, Indonesia",
        period: "Jul 2025 – Nov 2025",
        bullets: [
            "Conducted business analysis and project management, fostering cross-functional teamwork and stakeholder management to align high-impact automation opportunities with strategic business objectives.",
            "Drove business process re-engineering by orchestrating automation workflows (n8n, MCP, RPA), collapsing daily settlement file processing from hours to minutes.",
            "Applied strategic problem-solving during UAT validation, delivering process improvement initiatives with significant projected annual savings in operational cost.",
        ],
        tags: ["Fintech", "Automation", "n8n", "MCP", "RPA", "BPR"],
        viz: "workflow",
        brand: "#108EE9",
        slug: "dana",
        photoSlots: 2,
    },
    {
        company: "Binus International University",
        role: "Teaching Assistant · Software Development & Database Systems",
        location: "Jakarta, Indonesia",
        period: "Feb 2024 – Jan 2025",
        bullets: [
            "Facilitated weekly lab sessions for undergraduate students on MVC architecture and programming fundamentals, with consistently strong pass rates.",
            "Delivered practical instruction on SQL and data analysis, reinforcing foundational data-handling skills applicable in complex AI and blockchain systems.",
            "Provided change-management support for students adapting to new curriculum tools, improving code quality and lowering average error rates.",
        ],
        tags: ["Teaching", "MVC", "SQL", "Mentoring"],
        viz: "labSession",
        brand: "#8B5CF6",
        slug: "binus",
        photoSlots: 1,
    },
]

export interface Project {
    title: string
    kind: string
    period: string
    org?: string
    summary: string
    impact: string
    stack: string[]
    featured?: boolean
    viz: VizName
    brand: string
}

export const projects: Project[] = [
    {
        title: "AI Driver Video Validation",
        kind: "AI product · production",
        org: "Shopee Express",
        period: "2026",
        summary:
            "Computer-vision pipeline that validates driver-submitted delivery videos automatically, replacing a manual review queue. Owned from user research and requirements to production rollout.",
        impact: "Manual review retired; hours and cost returned to operations monthly",
        stack: ["Computer Vision", "Python", "Product Ownership"],
        featured: true,
        viz: "videoScan",
        brand: "#EE4D2D",
    },
    {
        title: "Final-Pin Accuracy Engine",
        kind: "ML product · in flight",
        org: "Shopee Express",
        period: "2026",
        summary:
            "Gradient-boosting classifier, batch confirmation detector and Bayesian pin fusion that correct wrong-zone delivery pins, enriched with ShopeeFood buyer-interaction signals.",
        impact: "Targets a major share of wrong-zone misrouting cost",
        stack: ["Gradient Boosting", "Bayesian Fusion", "Geo Data"],
        featured: true,
        viz: "pinFusion",
        brand: "#EE4D2D",
    },
    {
        title: "Settlement Automation Workflows",
        kind: "Process automation",
        org: "DANA Indonesia",
        period: "2025",
        summary:
            "Re-engineered the daily settlement file process with orchestrated n8n, MCP and RPA workflows, validated through UAT.",
        impact: "Daily processing cut from hours to minutes",
        stack: ["n8n", "MCP", "RPA", "BPR"],
        viz: "workflowTimer",
        brand: "#108EE9",
    },
    {
        title: "AI Self-Checkout for Bakery",
        kind: "Application development",
        period: "Mar – Jun 2024",
        summary:
            "Directed a small project team building an AI-driven self-checkout that recognises pastries with Roboflow (YOLOv8) and OpenCV, with real-time BI dashboards and MySQL–Firebase synchronisation.",
        impact: "Customer wait times cut sharply",
        stack: ["YOLOv8", "OpenCV", "MySQL", "Firebase", "BI"],
        viz: "yoloTray",
        brand: "#F59E0B",
    },
    {
        title: "Hooray Playground Management System",
        kind: "Technology consulting",
        org: "PT Haguro Inspira Mandiri",
        period: "Mar – Jun 2023",
        summary:
            "Diagnosed operational bottlenecks and engineered an Android ERP plus a new information-systems architecture for the client's ticketing infrastructure.",
        impact: "Manual ticketing largely automated; far shorter queues",
        stack: ["Android", "ERP", "IS Architecture"],
        viz: "ticketQueue",
        brand: "#EC4899",
    },
    {
        title: "AI Worksheet Quality Research",
        kind: "Product research",
        org: "Kitesense",
        period: "2025 – 2026",
        summary:
            "An extensive cross-platform test suite, PRDs, assessment rubrics and a multi-module GTM framework ahead of a national EdTech rollout across many schools.",
        impact: "Lower defect rate and higher topic accuracy before rollout",
        stack: ["PRDs", "QA", "GTM Research"],
        viz: "heatGrid",
        brand: "#14B8A6",
    },
]

export const education = [
    {
        school: "La Trobe University",
        degree: "Bachelor of Computer Science in Software Engineering",
        location: "Melbourne, Australia",
        period: "Sep 2022 – Feb 2026",
        gpa: "3.96 / 4.00",
        award: "Highest Achieving Student (2025)",
        coursework: [
            "Artificial Intelligence",
            "Machine Learning & Computational Intelligence",
            "Algorithms & Data Structures",
            "Data Analytics",
            "Full-Stack Application Development",
        ],
    },
    {
        school: "Binus International University",
        degree: "Bachelor of Business Information Systems",
        location: "Jakarta, Indonesia",
        period: "Sep 2022 – Feb 2026",
        gpa: "3.96 / 4.00",
        award: "Summa Cum Laude",
        coursework: [
            "Advanced IS Analysis & Design",
            "Software Engineering",
            "Full-Stack Application Development",
            "Accounting",
            "IT Infrastructure",
            "Project Management",
        ],
    },
]

export const skills = {
    functional: [
        "Project Management",
        "Business Analysis",
        "Business Process Re-engineering",
        "Stakeholder Management",
        "Strategic Problem Solving",
        "Data Analysis",
        "Change Management",
        "Teamwork & Collaboration",
    ],
    technical: [
        "Python",
        "SQL",
        "Java",
        "TypeScript",
        "Next.js",
        "React",
        "Node.js",
        "Tableau",
        "Amazon Web Services",
        "Microsoft Azure",
        "Firebase",
        "Git",
        "Selenium",
        "Microsoft Office Suite",
    ],
    certifications: [
        "Microsoft Certified: Azure AI Fundamentals",
        "SAP S/4HANA Fundamentals",
        "Google Cloud Computing Foundations (Data, ML, AI & Infrastructure)",
        "Foundations of User Experience (UX) Design",
    ],
    languages: ["English (Professional)", "Indonesian (Native)"],
    interests: [
        "Consulting",
        "Product Management",
        "Business Development",
        "Artificial Intelligence",
        "Blockchain & Cryptocurrency",
        "Machine Learning",
    ],
}

export const leadership = [
    {
        org: "Google Developer Student Club",
        role: "Technical Developer",
        location: "Jakarta, Indonesia",
        period: "Oct 2023 – Sep 2024",
        bullets: [
            "Led technical workshops on Git, Python for AI and Blockchain for a large student audience, fostering a community of technical learning.",
            "Collaborated on backend API integration and mentored junior developers.",
        ],
    },
    {
        org: "Class Representative Assembly",
        role: "Chairman",
        location: "Makassar, Indonesia",
        period: "Aug 2019 – Sep 2021",
        bullets: [
            "Led and supervised the Student Council in planning and executing school-wide programs, including remote initiatives during COVID-19.",
            "Contributed to Zion High School being ranked top nationally through strategic leadership, reporting directly to the principal.",
        ],
    },
]
