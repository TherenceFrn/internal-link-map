# Link Map for Yoast SEO

[![Latest release](https://img.shields.io/github/v/release/TherenceFrn/link-map-for-yoast-seo?label=version)](https://github.com/TherenceFrn/link-map-for-yoast-seo/releases/latest)
[![CI](https://github.com/TherenceFrn/link-map-for-yoast-seo/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TherenceFrn/link-map-for-yoast-seo/actions/workflows/ci.yml)

See your internal linking as an interactive graph and spot orphan pages, using the links [Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) already indexes. No crawl, no extra table, no external request.

The map lives under **Yoast SEO › Link map**. See [`readme.txt`](readme.txt) for the full description.

## Development

```sh
composer install
composer lint   # WordPress Coding Standards + PHP compatibility
composer test   # layout tests (Node 18+)
composer i18n   # regenerate languages/*.pot, .mo and .l10n.php
```

Files listed in `.distignore` are left out of the release archive.

## License

GPL-2.0-or-later. Not affiliated with or endorsed by Yoast BV.
