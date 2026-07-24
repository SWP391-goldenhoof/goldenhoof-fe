import { Link } from "react-router-dom";

function Icon({ name, size = 24 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    logo: (
      <>
        <path d="M7 20c0-7 3-10 8-12l2-4 1 6c2 2 3 4 3 7v3" />
        <path d="M7 20h9c2 0 3-1 3-3" />
        <path d="M10 10 5 6" />
        <path d="M15 12h.01" />
        <path d="M11 15h5" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 5 7 7-7 7" />
      </>
    ),
    trophy: (
      <>
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10v6a5 5 0 0 1-10 0V4Z" />
        <path d="M5 6H3v3a4 4 0 0 0 4 4" />
        <path d="M19 6h2v3a4 4 0 0 1-4 4" />
      </>
    ),
    horse: (
      <>
        <path d="M4 18v-5l4-4 5 1 3-3 4 4-3 2v5" />
        <path d="M8 14v4" />
        <path d="M13 14v4" />
        <path d="M16 8V4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20V8" />
      </>
    ),
  };

  return <svg {...common}>{paths[name]}</svg>;
}

const highlights = [
  ["trophy", "Live Race Results", "Follow active races and winners in real time."],
  ["horse", "Role Based Access", "Spectators and jockeys get the right workspace."],
  ["chart", "Rankings & Predictions", "Track performance, standings, and prediction points."],
];

export default function Landing() {
  return (
    <main className="landing-page">
      <style>{`
        * { box-sizing: border-box; }
        html, body, #root { min-height: 100%; margin: 0; }
        body {
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          color: #f4fffb;
          background: #002d28;
        }
        a { color: inherit; text-decoration: none; }

        .landing-page {
          min-height: 100dvh;
          background:
            linear-gradient(90deg, rgba(0, 35, 32, 0.96) 0%, rgba(0, 48, 43, 0.82) 38%, rgba(0, 37, 35, 0.34) 72%, rgba(0, 28, 27, 0.18) 100%),
            linear-gradient(0deg, rgba(0, 21, 20, 0.22), rgba(0, 21, 20, 0.18)),
            url("/goldenhoof-hero.png") center right / cover;
        }

        .landing-nav {
          position: fixed;
          z-index: 10;
          inset: 0 0 auto;
          height: 82px;
          border-bottom: 1px solid rgba(105, 248, 221, 0.2);
          background: rgba(0, 45, 40, 0.74);
          backdrop-filter: blur(18px);
        }

        .landing-container {
          width: min(1180px, calc(100% - 44px));
          margin: 0 auto;
        }

        .landing-nav-inner {
          height: 82px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .landing-brand {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
          font-size: 25px;
          font-weight: 950;
        }

        .landing-brand svg {
          color: #69f8dd;
        }

        .landing-menu {
          display: flex;
          align-items: center;
          gap: 28px;
          color: rgba(244, 255, 251, 0.8);
          font-weight: 850;
        }

        .landing-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 0 0 auto;
        }

        .landing-btn {
          min-height: 46px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 0 20px;
          border: 1px solid rgba(105, 248, 221, 0.45);
          border-radius: 8px;
          color: #f4fffb;
          background: rgba(255, 255, 255, 0.04);
          font-weight: 950;
        }

        .landing-btn-primary {
          border-color: transparent;
          color: #062724;
          background: #69f8dd;
        }

        .landing-hero {
          min-height: 100dvh;
          display: flex;
          align-items: center;
          padding: 116px 0 48px;
        }

        .landing-content {
          width: min(660px, 100%);
        }

        .landing-kicker {
          width: max-content;
          display: inline-flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 24px;
          padding: 9px 16px;
          border-radius: 999px;
          color: #69f8dd;
          background: rgba(105, 248, 221, 0.14);
          font-size: 14px;
          font-weight: 950;
        }

        .landing-kicker::before {
          content: "";
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: #69f8dd;
        }

        .landing-content h1 {
          margin: 0;
          font-size: clamp(50px, 7vw, 86px);
          line-height: 1.04;
          font-weight: 950;
          letter-spacing: 0;
        }

        .landing-content h1 span {
          display: block;
          color: #69f8dd;
        }

        .landing-copy {
          max-width: 590px;
          margin: 26px 0 34px;
          color: rgba(244, 255, 251, 0.84);
          font-size: 19px;
          line-height: 1.68;
        }

        .landing-hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 48px;
        }

        .landing-highlights {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .landing-highlight {
          min-height: 156px;
          padding: 18px;
          border: 1px solid rgba(105, 248, 221, 0.2);
          border-radius: 8px;
          background: rgba(0, 45, 40, 0.6);
          backdrop-filter: blur(14px);
        }

        .landing-highlight svg {
          color: #69f8dd;
          margin-bottom: 14px;
        }

        .landing-highlight strong {
          display: block;
          margin-bottom: 8px;
          font-size: 17px;
          font-weight: 950;
        }

        .landing-highlight span {
          color: rgba(244, 255, 251, 0.72);
          font-size: 14px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .landing-menu { display: none; }
          .landing-highlights { grid-template-columns: 1fr; }
          .landing-page {
            background-position: center;
          }
        }

        @media (max-width: 620px) {
          .landing-container { width: min(100% - 28px, 1180px); }
          .landing-nav,
          .landing-nav-inner { height: 74px; }
          .landing-nav-inner { gap: 10px; }
          .landing-brand { font-size: 21px; }
          .landing-actions { gap: 8px; }
          .landing-actions .landing-btn {
            min-height: 42px;
            padding: 0 13px;
            font-size: 14px;
          }
          .landing-content h1 { font-size: clamp(42px, 13vw, 62px); }
          .landing-copy { font-size: 16px; }
        }

        @media (max-width: 430px) {
          .landing-container { width: min(100% - 22px, 1180px); }
          .landing-brand span { display: none; }
          .landing-actions .landing-btn {
            min-height: 40px;
            padding: 0 11px;
            font-size: 13px;
          }
        }
      `}</style>

      <header className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <Link className="landing-brand" to="/">
            <img className="landing-brand-logo" src="/goldenhoof-logo.png" alt="" />
            <span>GoldenHoof</span>
          </Link>

          <nav className="landing-menu" aria-label="Landing navigation">
            <Link to="/home">Races</Link>
            <Link to="/home">Rankings</Link>
            <Link to="/home">Predictions</Link>
          </nav>

          <div className="landing-actions">
            <Link className="landing-btn" to="/login">
              Log in
            </Link>
            <Link className="landing-btn landing-btn-primary" to="/register">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-content">
            <span className="landing-kicker">LIVE THE THRILL</span>
            <h1>
              GoldenHoof
              <span>Horse Racing</span>
            </h1>
            <p className="landing-copy">
              A racing platform for fans and jockeys to follow live events,
              manage role-based access, and stay close to every finish line.
            </p>

            <div className="landing-hero-actions">
              <Link className="landing-btn landing-btn-primary" to="/home">
                Explore Races
                <Icon name="arrow" size={20} />
              </Link>
              <Link className="landing-btn" to="/login">
                Login by Role
                <Icon name="arrow" size={20} />
              </Link>
            </div>

            <div className="landing-highlights">
              {highlights.map(([icon, title, text]) => (
                <article className="landing-highlight" key={title}>
                  <Icon name={icon} size={31} />
                  <strong>{title}</strong>
                  <span>{text}</span>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
