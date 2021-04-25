module.exports = {
  title: "⛴🧛🏻‍♂️",
  tagline: "Make **works-on-cloud** as easy as *works-on-my-machine*!",
  url: "https://userbugreport.github.io/shipula/",
  baseUrl: "/",
  favicon: "img/favicon.ico",
  organizationName: "userbugreport", // Usually your GitHub org/user name.
  projectName: "shipula", // Usually your repo name.
  themeConfig: {
    navbar: {
      title: "Shipula",
      logo: {
        alt: "My Site Logo",
        src: "img/logo.png",
      },
      items: [
        {
          to: "docs/",
          activeBasePath: "docs",
          label: "Docs",
          position: "left",
        },
        {
          href: "https://github.com/userbugreport/shipula",
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Getting Started",
              to: "docs/",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "GitHub",
              href: "https://github.com/userbugreport/shipula",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()}`,
    },
  },
  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          sidebarPath: require.resolve("./sidebars.js"),
        },
        blog: {
          showReadingTime: true,
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
