// node --test tests/layout.test.js
const { test } = require('node:test');
const assert = require('node:assert');
const { layout } = require('../assets/graph.js');

test('les nœuds liés se rapprochent et le graphe reste centré', () => {
    const nodes = Array.from({ length: 12 }, (_, id) => ({ id }));
    const edges = [[0, 1], [1, 2], [2, 0]].map(([s, t]) => ({ s: nodes[s], t: nodes[t] }));
    layout(nodes, edges, 800, 500);

    const cx = nodes.reduce((sum, p) => sum + p.x, 0) / nodes.length;
    const cy = nodes.reduce((sum, p) => sum + p.y, 0) / nodes.length;
    assert.ok(Math.hypot(cx - 400, cy - 250) < 100, `centre ${cx.toFixed(0)},${cy.toFixed(0)}`);
    nodes.forEach((p) => assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y), `nœud ${p.id} invalide`));

    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const linked = dist(nodes[0], nodes[1]);
    const unlinked = (dist(nodes[0], nodes[6]) + dist(nodes[1], nodes[9])) / 2;
    assert.ok(linked < unlinked, `lié ${linked.toFixed(0)} >= non lié ${unlinked.toFixed(0)}`);
});

test('graphe vide', () => {
    assert.deepStrictEqual(layout([], [], 800, 500), []);
});
