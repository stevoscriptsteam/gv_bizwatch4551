import { PageHeader } from "@/components/ui/PageHeader";
import Link from "next/link";

function StaticPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="container-content">
      <div className="container-reading">
        <PageHeader title={title} description={description} />
        <div className="article-prose mt-6">{children}</div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <StaticPage
      title="See it. Report it. Every report counts."
      description="A private community safety reporting service for registered businesses in Caloundra and postcode 4551."
    >
      <p>
        If you&apos;ve experienced theft, vandalism, threatening behaviour or suspicious
        activity, please report it to Queensland Police through{" "}
        <a
          href="https://www.police.qld.gov.au/policelink-reporting"
          target="_blank"
          rel="noopener noreferrer"
        >
          Policelink
        </a>{" "}
        or call{" "}
        <a href="tel:131444">131 444</a>. If it is happening now or someone is in immediate
        danger, call <a href="tel:000">000</a>.
      </p>

      <p>
        BizWatch 4551 does not replace reporting to police. It was created as a faster way for
        local businesses to communicate with one another about concerning, unacceptable or
        disruptive behaviour occurring across our business community.
      </p>

      <p>
        After lodging a police report, we encourage businesses to also record the incident
        through BizWatch 4551.
      </p>

      <p>By bringing this information together, we can better identify:</p>
      <ul>
        <li>recurring hotspots</li>
        <li>patterns in the types and timing of incidents</li>
        <li>areas that may benefit from improved lighting, CCTV or grant funding</li>
        <li>
          locations where landlords, property managers or relevant authorities need to be made
          aware
        </li>
        <li>businesses that may need support or a simple check-in following an incident</li>
      </ul>

      <p>
        We all have a vested interest in keeping our businesses, our staff, our customers and
        our wider community safe.
      </p>

      <p>
        Caloundra is experiencing unprecedented growth. We want that growth to continue while
        protecting the place we love, care for and feel safe in.
      </p>

      <p>
        As discussed again at last night&apos;s meeting, our aim is to disrupt this behaviour.
        It has no place in our community.
      </p>

      <p>
        The more informed and connected we are, the better equipped we are to respond, support
        one another and advocate for practical solutions.
      </p>

      <p>As one, we are stronger.</p>

      <div className="mt-8 flex flex-wrap gap-3 not-prose">
        <Link href="/register" className="btn btn-primary inline-flex">
          Register your business
        </Link>
        <Link href="/sign-in" className="btn btn-secondary inline-flex">
          Sign in
        </Link>
      </div>
    </StaticPage>
  );
}
