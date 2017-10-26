const description = "We made the CI service to fit your team!"
const title = "Rocket CI"

export default {
  description,
  titleTemplate: `%s - ${title}`,
  meta: [
    {"name": "description", "content": description},
    {"property": "og:title", "content": title},
    {"property": "og:site_name", "content": title},
    {"property": "og:description", "content": description},
    {"property": "og:type", "content": "website"},
    {"property": "og:image", "content": "https://rocket-ci.com/favicon-230x230.png"},
  ],
  link: [
    {rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png"},
    {rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png"},
    {rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png"},
    {rel: "icon", type: "image/png", sizes: "230x230", href: "/favicon-230x230.png"},
    {rel: "apple-touch-icon", sizes: "57x57", href: "/apple-touch-icon-57x57.png"},
    {rel: "apple-touch-icon", sizes: "60x60", href: "/apple-touch-icon-60x60.png"},
    {rel: "apple-touch-icon", sizes: "72x72", href: "/apple-touch-icon-72x72.png"},
    {rel: "apple-touch-icon", sizes: "76x76", href: "/apple-touch-icon-76x76.png"},
    {rel: "apple-touch-icon", sizes: "114x114", href: "/apple-touch-icon-114x114.png"},
    {rel: "apple-touch-icon", sizes: "120x120", href: "/apple-touch-icon-120x120.png"},
    {rel: "apple-touch-icon", sizes: "144x144", href: "/apple-touch-icon-144x144.png"},
    {rel: "apple-touch-icon", sizes: "152x152", href: "/apple-touch-icon-152x152.png"},
    {rel: "apple-touch-icon", sizes: "167x167", href: "/apple-touch-icon-167x167.png"},
    {rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon-180x180.png"},
  ]
}
