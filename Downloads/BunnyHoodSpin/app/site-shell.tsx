import { PROJECT_X_URL } from "./site-data";

export function DirectionIcon({ down = false }: { down?: boolean }) {
  return <i className={`css-arrow${down ? " down" : ""}`} aria-hidden="true" />;
}

export function SiteNav({ home = false }: { home?: boolean }) {
  return (
    <nav className="site-nav" aria-label="Main navigation">
      <a className="brand" href={home ? "#top" : "/"} aria-label="Bunny Hood home">
        <img src="/assets/bunny-hood-mark.webp" alt="" />
        <span>BUNNY HOOD</span>
      </a>
      <div className="nav-links">
        <a href={home ? "#collection" : "/#collection"}>Collection</a>
        <a href="/SpinTheWheel">Spin the Wheel</a>
      </div>
      <a className="nav-x" href={PROJECT_X_URL} target="_blank" rel="noreferrer" aria-label="Visit Bunny Hood on X">
        X <DirectionIcon />
      </a>
    </nav>
  );
}

export function SiteFooter({ home = false }: { home?: boolean }) {
  return (
    <footer>
      <a className="brand" href={home ? "#top" : "/"}>
        <img src="/assets/bunny-hood-mark.webp" alt="" />
        <span>BUNNY HOOD</span>
      </a>
      <p>3999 BUNNYS ON ROBINHOOD CHAIN</p>
      <a href={PROJECT_X_URL} target="_blank" rel="noreferrer">
        @BunnysHood <DirectionIcon />
      </a>
    </footer>
  );
}
