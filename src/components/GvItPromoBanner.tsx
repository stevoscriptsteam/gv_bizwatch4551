export function GvItPromoBanner() {
  return (
    <aside className="gv-promo" aria-label="Advertisement from GV Integrated Solutions">
      <p className="gv-promo-eyebrow">From GV Integrated Solutions</p>
      <div className="gv-promo-body">
        <div className="gv-promo-copy">
          <h2 className="gv-promo-title">Enterprise-grade IT management for small business</h2>
          <p className="gv-promo-text">
            Systems, support, websites and practical tech advice — so local businesses get
            reliable IT without the cost of hiring an internal team.
          </p>
        </div>
        <a
          href="https://gvintegratedsolutions.com.au"
          className="btn btn-secondary gv-promo-cta"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn more
        </a>
      </div>
    </aside>
  );
}
