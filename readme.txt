=== Link Map for Yoast SEO ===
Contributors: therence
Tags: internal links, internal linking, link graph, orphan pages, seo
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 1.0.1
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

See your internal linking as an interactive graph and spot orphan pages, using the links Yoast SEO already indexes.

== Description ==

Yoast SEO records every internal link on your site, but only shows them as counts in a column. Link Map for Yoast SEO turns that data into a map:

* **Interactive graph** of your published content, categories and archives. Each arrow is an internal link; a node grows with its incoming links.
* **Orphan content**: pages with no incoming link are circled in red and listed in a table, with a link to edit each one.
* **Focus mode**: click a page to isolate it with the pages it links to and from. Double-click to edit it.
* **Nothing to configure, nothing stored**: the plugin only reads the link tables Yoast SEO maintains. No extra crawl, no database table, no external request.

The map lives under **Yoast SEO › Link map** and is available to editors and administrators.

= Requirements =

[Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) must be installed and active. If the map is empty, run **Yoast SEO › Tools › Optimize SEO data** once so Yoast indexes your existing content.

This plugin is not affiliated with or endorsed by Yoast BV.

== Installation ==

1. Install and activate Yoast SEO.
2. In **Plugins › Add New**, search for "Link Map for Yoast SEO", then install and activate it.
3. Open **Yoast SEO › Link map**.

== Frequently Asked Questions ==

= Why is a page missing from the map? =

The map shows published content of public post types, plus any category, tag or archive that receives or sends an internal link. Drafts, scheduled posts and media are left out.

= Why do the counts differ from the arrows? =

Counts come straight from Yoast SEO and include links from drafts. Arrows only connect pages that are on the map.

= Does it slow down my site? =

No. The plugin runs only on its own admin page and adds nothing to the front end.

== Screenshots ==

1. The link map, with orphan pages circled in red.
2. Focus mode on a single page.

== Changelog ==

= 1.0.1 =
* First release.
