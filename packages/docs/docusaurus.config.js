module.exports = {
  title: "⛴🧛🏻‍♂️",
  tagline: "Make **works-on-cloud** as easy as *works-on-my-machine*!",
  url: "https://userbugreport.github.io/shipula/",
  baseUrl: "/shipula/",
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
      links: [
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
            {
              label: "Concepts",
              to: "docs/concepts/",
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
          homePageId: "getting-started", // Set to existing document id.
          sidebarPath: require.resolve("./sidebars.js"),
          // Please change this to your repo.
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/",
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          editUrl:
            "https://github.com/facebook/docusaurus/edit/master/website/blog/",
        },
        theme: {
          customCss: require.resolve("./src/css/custom.css"),
        },
      },
    ],
  ],
};
