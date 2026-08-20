# gyanmitra


**A peer-tutoring platform helping village school students catch up on foundational reading & math skills — built by a student, for students.**

## The Problem

In many village and low-fee private schools across India, students are promoted from one grade to the next based on age, not mastery. This creates a silent, growing gap — a child can be sitting in 5th grade while still reading at a 2nd grade level, and no one catches it in time.

This isn't a rare case. It's a well-documented, widespread issue in India's education system, often called "learning poverty" — children are in school, but not learning what their grade level expects. I experienced this gap myself early in my school journey, which is why I wanted to build something that actually addresses it.

Proven teaching methods to fix this exist (like assessment-based, level-grouped instruction), but they typically rely on trained adult instructors or NGO staff — resources most under-resourced village schools simply don't have access to.

## The Idea

GyanMitra uses a **peer-tutoring model**: senior students (grades 9-12) are trained to tutor junior students (grades 3-8) who are behind their grade level, based on a simple one-on-one assessment.

- **In-person sessions are low-tech, on paper** — no devices needed for the actual teaching.
- **The webapp is used once a week, on weekends** — a parent opens it with their child for a short progress check-in, while the senior tutor separately logs feedback and session notes.
- **No open chat between minors** — only structured, supervised interactions (quiz results, feedback notes) to keep the platform safe.
- **Full transparency and consent** — school faculty and parents approve participation before any student joins.

## Who It Helps

- **Junior students**: get focused, judgment-free help at their actual learning level, from someone closer to their age — and a visible "progress ladder" to see their own growth.
- **Senior students (tutors)**: gain real teaching and leadership experience, along with a personal impact record they can use for their own college applications.
- **Schools & parents**: get a simple, transparent way to track a struggling student's improvement over time.

## Features (Current)

- [ ] Consent & permission flow (school + parent approval)
- [ ] Coordinator dashboard (student levels, tutor groups)
- [ ] Weekend parent + student check-in
- [ ] Senior tutor feedback & session logging
- [ ] Student progress ladder visualization

## Features (Planned)

- [ ] Automated re-grouping suggestions as students improve
- [ ] Tutor impact certificates/summaries
- [ ] Multi-language support (Hindi + regional languages)
- [ ] Offline-first support for low-connectivity areas

## Tech Stack

- **Frontend**: React (Vite) + Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB / Firebase
- **Auth**: Firebase Authentication
- **Hosting**: Vercel (frontend), Render (backend)

## Project Status

🚧 Actively in development — this is an early-stage, student-built project. Feedback and contributions welcome.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/yourusername/gyanmitra.git

# Install frontend dependencies
cd client
npm install
npm run dev

# Install backend dependencies
cd ../server
npm install
npm run start
```

## Why "GyanMitra"?

"Gyan" means knowledge, and "Mitra" means friend — the platform is designed to be a friend in a student's learning journey, delivered by peers who understand them.

## License

MIT License — free to use and adapt.

## Acknowledgements

This project draws inspiration from evidence-based education research, including ASER (Annual Status of Education Report) and studies on peer-tutoring interventions, adapted here into an original, student-led implementation.
