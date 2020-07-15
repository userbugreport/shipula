import React from "react";
import clsx from "clsx";
import Layout from "@theme/Layout";
import Link from "@docusaurus/Link";
import useDocusaurusContext from "@docusaurus/useDocusaurusContext";
import useBaseUrl from "@docusaurus/useBaseUrl";
import styles from "./styles.module.css";
import {
  FaNode,
  FaCloud,
  FaLaptopCode,
  FaLock,
  FaGlobe,
  FaServer,
} from "react-icons/fa";

const features = [
  {
    title: <>Works With Node</>,
    icon: <FaNode />,
    description: (
      <>
        Not a new framework, just keep programming with node the way you know
        with popular frameworks like Express or Koa. Creates static sites with
        Docusaurus.
      </>
    ),
  },
  {
    title: <>Develop Locally</>,
    icon: <FaLaptopCode />,
    description: (
      <>
        No need to learn containers, or remote cloud emulators, or even Docker.
        Develop locally the easy way, and save the cloud for deployment.
      </>
    ),
  },
  {
    title: <>One Line Cloud Deploy</>,
    icon: <FaCloud />,
    description: (
      <>
        When it is time to ⛴ -- one command line will get you on the cloud.
        Easy.
      </>
    ),
  },
  {
    title: <>Custom Domain Names</>,
    icon: <FaGlobe />,
    description: <>Easiest custom DNS experience on the planet!</>,
  },
  {
    title: <>Custom Domain Names</>,
    icon: <FaLock />,
    description: (
      <>Automatic HTTPs -- secure by default with custom domain names.</>
    ),
  },
  {
    title: <>Simple Administration</>,
    icon: <FaServer />,
    description: (
      <>
        Automatic backups, built in log streaming, and an easy to use shared
        file system.
      </>
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
          <p className="hero__subtitle">
            Make <i>works on cloud</i> as easy as <b>works on my machine</b>!
          </p>
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
