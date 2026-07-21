"use client";

import dynamic from "next/dynamic";

const ServiceAreaMap = dynamic(
  () => import("@/components/ServiceAreaMap").then((m) => m.ServiceAreaMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="service-area-map"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p className="small-text">Loading map…</p>
      </div>
    ),
  },
);

export function ServiceAreaSection() {
  return (
    <section className="section-spaced" aria-labelledby="area-heading">
      <h2 id="area-heading" className="section-heading" style={{ marginBottom: 16 }}>
        Biz Watchzone
      </h2>
      <p className="supporting-text" style={{ marginBottom: 24, maxWidth: "720px" }}>
        The Biz Watchzone covers postcode 4551 on the Sunshine Coast. Access to reporting
        and alerts is limited to registered businesses within this area.
      </p>
      <ServiceAreaMap />
    </section>
  );
}
