=== Internal Link Map ===
Contributors: therence
Tags: internal links, internal linking, link graph, orphan pages, seo
Requires at least: 6.5
Tested up to: 7.1
Requires PHP: 8.1
Stable tag: 1.1.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

See your internal linking as an interactive graph and spot orphan pages, using the links Yoast SEO already indexes.

== Description ==

Yoast SEO records every internal link on your site, but only shows them as counts in a column. Internal Link Map turns that data into a map:

* **Interactive graph** of your published content, categories and archives. Each arrow is an internal link; a node grows with its incoming links.
* **Orphan content**: pages with no incoming link are circled in red and listed in a collapsible side panel, with a link to edit each one.
* **Focus mode**: click a page to isolate it with the pages it links to and from. Double-click to edit it.
* **Explore and export**: zoom, pan, search for a page, and download the current view as a PNG image.
* **Nothing to configure, nothing stored**: the plugin only reads the link tables Yoast SEO maintains. No extra crawl, no database table, no external request.

The map lives under **Yoast SEO › Link map** and is available to editors and administrators.

= Requirements =

[Yoast SEO](https://wordpress.org/plugins/wordpress-seo/) must be installed and active. If the map is empty, run **Yoast SEO › Tools › Optimize SEO data** once so Yoast indexes your existing content.

This plugin is not affiliated with or endorsed by Yoast BV.

== Installation ==

1. Install and activate Yoast SEO.
2. In **Plugins › Add New**, search for "Internal Link Map", then install and activate it.
3. Open **Yoast SEO › Link map**.

== Frequently Asked Questions ==

= Why is a page missing from the map? =

The map shows published content of public post types, plus any category, tag or archive that receives or sends an internal link. Drafts, scheduled posts and media are left out.

= Which links are counted? =

Links inside your content, as indexed by Yoast SEO. Menus, header, footer and widgets are not counted. As in Yoast's own orphaned content filter, the front page and the posts page are never reported as orphans.

= Does it work with custom post types and taxonomies? =

Yes. Every public post type is mapped, orphans included. Categories, tags and custom taxonomy terms appear as soon as content links to them; a term that nothing links to is not shown, and terms are never reported as orphans.

= Why do the counts differ from the arrows? =

Counts come straight from Yoast SEO and include links from drafts. Arrows only connect pages that are on the map.

= Does it slow down my site? =

No. The plugin runs only on its own admin page and adds nothing to the front end.

== Screenshots ==

1. The link map, with orphan pages circled in red.
2. Focus mode on a single page.

== Changelog ==

= 1.1.0 =
* Renamed to Internal Link Map (plugin folder `internal-link-map`), as WordPress.org does not allow "Yoast" in plugin names. Deactivate the old version, then install and activate this one.

= 1.0.6 =
* Download the current view as a PNG image.
* Orphan content moves to a collapsible side panel, set apart from the map.
* The front page and the posts page are no longer reported as orphans.
* Translated labels for author, date and search archives.

= 1.0.2 =
* "Open map" link on the Plugins screen.
* Instant focus mode, without fade animation.

= 1.0.1 =
* First release.
