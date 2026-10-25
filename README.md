# KS&Co. Events Website

Production source for [KS&Co. Events](https://www.ksandcoevents.com).

## Build

The approved site source lives in `dist/index.html`. The production build generates independent static URLs for services, recent events, galleries, articles, contact, and privacy without adding a frontend framework.

```sh
node scripts/build-production-site.mjs
node scripts/check-production-site.mjs
```

Netlify reads `netlify.toml`, runs both commands, and publishes `production`.

## Contact form

Set `WEB3FORMS_ACCESS_KEY` in Netlify before launch. The build injects the public browser-side form identifier only into the Contact page. Configure Web3Forms domain and spam controls; do not treat the access key as a secret.

## Content rights

The website copy, photography, visual assets, and design are owned by their respective rights holders. Their presence in this public source repository does not grant permission to reuse them.
