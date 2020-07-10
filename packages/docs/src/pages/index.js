import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import { FaNode, FaCloud, FaLaptopCode } from "react-icons/fa";

const features = [
  {
    title: <>Works With Node</>,
    icon: <FaNode />,
    description: (
      <>
        Not a new framework, just keep programming with node the way you know
        with popular frameworks like Express and Koa.
      </>
    ),
  },
  {
    title: <>Develop Locally</>,
    icon: <FaLaptopCode />,
    description: (
      <>
        No need to learn containers, or remote cloud emulators. Develop locally
        the easy way, and save the cloud for deployment.
      </>
    ),
  },
  {
    title: <>One Line Cloud Deploy</>,
    icon: <FaCloud />,
    description: (
      <>When it is time to ⛴ -- one command line will get you on the cloud.</>
    ),
  },
];

function Feature({ icon, title, description }) {
  return (
    <div className={clsx("col col--4", styles.features)}>
      <div className={clsx("", styles.featureIcon)}>{icon}</div>
      <h3 className={styles.features}>{title}</h3>
      <p className={styles.features}>{description}</p>
    </div>
  );
}

function Home() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;
  return (
    <Layout
      title={`Hello from ${siteConfig.title}`}
      description="Description will go into a meta tag in <head />"
    >
      <header className={clsx("hero hero--dark", styles.heroBanner)}>
        <div className="container">
          <h1 className="hero__title">{siteConfig.title}</h1>
          <p className="hero__subtitle">{siteConfig.tagline}</p>
          <div className={styles.buttons}>
            <Link
              className={clsx(
                "button button--outline button--link button--lg",
                styles.getStarted
              )}
              to={useBaseUrl("docs/")}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>
      <main>
        {features && features.length > 0 && (
          <section className={styles.features}>
            <div className="container">
              <div className="row">
                {features.map((props, idx) => (
                  <Feature key={idx} {...props} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </Layout>
  );
}

export default Home;