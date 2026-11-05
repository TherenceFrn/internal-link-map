<?php
/**
 * Plugin Name:       Internal Link Map
 * Plugin URI:        https://github.com/TherenceFrn/internal-link-map
 * Description:       Visualise your internal linking as an interactive graph, built from the links Yoast SEO already indexes.
 * Version:           1.1.0
 * Requires at least: 6.5
 * Requires PHP:      8.1
 * Requires Plugins:  wordpress-seo
 * Author:            TherenceFrn
 * Author URI:        https://github.com/TherenceFrn
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       internal-link-map
 * Domain Path:       /languages
 *
 * @package InternalLinkMap
 */

declare(strict_types=1);

namespace InternalLinkMap;

defined( 'ABSPATH' ) || exit;

const VERSION = '1.1.0';
const SLUG    = 'internal-link-map';

// Bundled translations until translate.wordpress.org serves them.
add_action(
	'init',
	static function (): void {
		load_plugin_textdomain( SLUG, false, dirname( plugin_basename( __FILE__ ) ) . '/languages' ); // phpcs:ignore PluginCheck.CodeAnalysis.DiscouragedFunctions.load_plugin_textdomainFound
	}
);

// After Yoast SEO, which registers the "wpseo_dashboard" parent menu.
add_action(
	'admin_menu',
	static function (): void {
		if ( ! defined( 'WPSEO_VERSION' ) ) {
			return;
		}

		$hook = add_submenu_page(
			'wpseo_dashboard',
			__( 'Internal link map', 'internal-link-map' ),
			__( 'Link map', 'internal-link-map' ),
			'edit_others_posts',
			SLUG,
			__NAMESPACE__ . '\\render'
		);

		if ( $hook ) {
			add_action( "load-{$hook}", __NAMESPACE__ . '\\enqueue' );
		}
	},
	20
);

// "Open map" link in the plugin's row on the Plugins screen.
add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	static function ( array $links ): array {
		if ( defined( 'WPSEO_VERSION' ) && current_user_can( 'edit_others_posts' ) ) {
			$url = admin_url( 'admin.php?page=' . SLUG );
			array_unshift( $links, '<a href="' . esc_url( $url ) . '">' . esc_html__( 'Open map', 'internal-link-map' ) . '</a>' );
		}

		return $links;
	}
);

function enqueue(): void {
	wp_enqueue_style( SLUG, plugins_url( 'assets/graph.css', __FILE__ ), array( 'dashicons' ), VERSION );
	wp_enqueue_script( SLUG, plugins_url( 'assets/graph.js', __FILE__ ), array(), VERSION, array( 'in_footer' => true ) );

	$data = graph() + array(
		'i18n' => array(
			'empty'      => __( 'Yoast SEO has not indexed any internal link yet.', 'internal-link-map' ),
			'graph'      => __( 'Internal link graph', 'internal-link-map' ),
			'orphan'     => __( 'no incoming link', 'internal-link-map' ),
			/* translators: 1: number of incoming links, 2: number of outgoing links. */
			'counts'     => __( '%1$d incoming · %2$d outgoing', 'internal-link-map' ),
			'search'     => __( 'Find a page…', 'internal-link-map' ),
			'zoomIn'     => __( 'Zoom in', 'internal-link-map' ),
			'zoomOut'    => __( 'Zoom out', 'internal-link-map' ),
			'fit'        => __( 'Fit to screen', 'internal-link-map' ),
			'screenshot' => __( 'Download as image', 'internal-link-map' ),
		),
	);
	wp_add_inline_script( SLUG, 'window.internalLinkMap = ' . wp_json_encode( $data ) . ';', 'before' );
}

/**
 * Nodes: published content (orphans included) and any linked archive or term.
 * Counts: the former "wpseo-links" / "wpseo-linked" columns, now stored on Yoast indexables.
 *
 * @return array{nodes: list<array<string, mixed>>, edges: list<array{source: int, target: int, n: int}>}
 */
function graph(): array {
	static $graph = null;
	if ( null !== $graph ) {
		return $graph;
	}

	global $wpdb;

	$links      = $wpdb->prefix . 'yoast_seo_links';
	$indexables = $wpdb->prefix . 'yoast_indexable';
	$types      = array_diff( get_post_types( array( 'public' => true ) ), array( 'attachment' ) );

	// Yoast's own tables have no WordPress API; read once per admin page view.
	// phpcs:disable WordPress.DB.DirectDatabaseQuery
	$edges = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT indexable_id AS source, target_indexable_id AS target, COUNT(*) AS n
             FROM %i
             WHERE type = %s AND target_indexable_id IS NOT NULL AND indexable_id <> target_indexable_id
             GROUP BY indexable_id, target_indexable_id',
			$links,
			'internal'
		),
		ARRAY_A
	);

	$rows = $wpdb->get_results(
		$wpdb->prepare(
			'SELECT id, object_id, object_type, object_sub_type, breadcrumb_title, permalink, link_count, incoming_link_count
             FROM %i
             WHERE (object_type = %s AND post_status = %s)
                OR (object_type <> %s AND id IN (
                    SELECT target_indexable_id FROM %i WHERE type = %s
                    UNION SELECT indexable_id FROM %i WHERE type = %s
                ))',
			$indexables,
			'post',
			'publish',
			'post',
			$links,
			'internal',
			$links,
			'internal'
		),
		ARRAY_A
	);
	// phpcs:enable

	// Like Yoast's own orphaned content filter: the front page and the posts page are reached through navigation.
	$navigation = 'page' === get_option( 'show_on_front' ) ? array( (int) get_option( 'page_on_front' ), (int) get_option( 'page_for_posts' ) ) : array();

	$nodes = array();
	foreach ( $rows as $row ) {
		if ( 'post' === $row['object_type'] && ! in_array( $row['object_sub_type'], $types, true ) ) {
			continue;
		}

		$id           = (int) $row['id'];
		$nodes[ $id ] = array(
			'id'     => $id,
			'label'  => $row['breadcrumb_title'] ? $row['breadcrumb_title'] : (string) wp_parse_url( (string) $row['permalink'], PHP_URL_PATH ),
			'group'  => group_label( $row ),
			'orphan' => 'post' === $row['object_type'] && 0 === (int) $row['incoming_link_count'] && ! in_array( (int) $row['object_id'], $navigation, true ),
			'url'    => $row['permalink'],
			'edit'   => edit_link( $row ),
			'out'    => (int) $row['link_count'],
			'in'     => (int) $row['incoming_link_count'],
		);
	}

	// Links from drafts, or to pages outside the graph, are left out.
	$edges = array_values(
		array_filter(
			array_map( static fn ( array $e ): array => array_map( 'intval', $e ), $edges ),
			static fn ( array $e ): bool => isset( $nodes[ $e['source'] ], $nodes[ $e['target'] ] )
		)
	);

	$graph = array(
		'nodes' => array_values( $nodes ),
		'edges' => $edges,
	);

	return $graph;
}

/** @param array<string, string|null> $row */
function group_label( array $row ): string {
	$sub  = (string) $row['object_sub_type'];
	$type = get_post_type_object( $sub );
	$name = match ( $row['object_type'] ) {
		'post' => $type?->labels->name,
		'term' => get_taxonomy( $sub )->labels->name ?? null,
		/* translators: %s: post type name, e.g. "Products". */
		'post-type-archive' => $type ? sprintf( __( '%s archive', 'internal-link-map' ), $type->labels->name ) : null,
		'home-page' => __( 'Home page', 'internal-link-map' ),
		'user' => __( 'Author archives', 'internal-link-map' ),
		'date-archive' => __( 'Date archives', 'internal-link-map' ),
		'system-page' => __( 'Search and error pages', 'internal-link-map' ),
		default => null,
	};

	return $name ? $name : (string) $row['object_type'];
}

/** @param array<string, string|null> $row */
function edit_link( array $row ): ?string {
	$link = match ( $row['object_type'] ) {
		'post' => get_edit_post_link( (int) $row['object_id'], 'raw' ),
		'term' => get_edit_term_link( (int) $row['object_id'], (string) $row['object_sub_type'] ),
		default => null,
	};

	return $link ? $link : null;
}

function render(): void {
	$orphans = array_filter( graph()['nodes'], static fn ( array $n ): bool => $n['orphan'] );
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Internal link map', 'internal-link-map' ); ?></h1>
		<p class="description">
			<?php esc_html_e( 'Internal links found in your content by Yoast SEO (menus, header and footer are not counted). Node size: incoming links. Scroll to zoom, drag the background to move around, drag a node to rearrange. Click a node to isolate it with its neighbours, double-click to edit it. If the map is empty, run the SEO data optimization in Yoast SEO › Tools.', 'internal-link-map' ); ?>
		</p>
		<div class="lmys">
			<div id="internal-link-map" class="lmys-map"></div>

			<?php // Collapsed by default; native <details> needs no script and works with the keyboard. ?>
			<details class="lmys-aside">
				<summary>
					<?php
					/* translators: %d: number of orphan pages. */
					printf( esc_html__( 'Orphan content (%d)', 'internal-link-map' ), count( $orphans ) );
					?>
				</summary>
				<div class="lmys-aside-body">
					<?php if ( array() === $orphans ) : ?>
						<p><?php esc_html_e( 'Every published page has at least one incoming link.', 'internal-link-map' ); ?></p>
					<?php else : ?>
						<p class="description"><?php esc_html_e( 'Published content that no other page links to.', 'internal-link-map' ); ?></p>
						<ul>
							<?php foreach ( $orphans as $node ) : ?>
								<li>
									<?php if ( $node['edit'] ) : ?>
										<a href="<?php echo esc_url( $node['edit'] ); ?>"><?php echo esc_html( $node['label'] ); ?></a>
									<?php else : ?>
										<?php echo esc_html( $node['label'] ); ?>
									<?php endif; ?>
									<span>
										<?php
										echo esc_html( $node['group'] ) . ' · ';
										/* translators: %d: number of outgoing internal links. */
										printf( esc_html( _n( '%d outgoing link', '%d outgoing links', $node['out'], 'internal-link-map' ) ), (int) $node['out'] );
										?>
									</span>
								</li>
							<?php endforeach; ?>
						</ul>
					<?php endif; ?>
				</div>
			</details>
		</div>
	</div>
	<?php
}
