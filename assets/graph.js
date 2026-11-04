/* Internal link map: force-directed layout (Fruchterman-Reingold) and SVG rendering, dependency-free. */
(function () {
    'use strict';

    // shortcut: O(n²) repulsion, smooth up to ~1,500 nodes; beyond that, switch to a Barnes-Hut layout (d3-force).
    function layout(nodes, edges, w, h, iterations = 300) {
        const n = nodes.length;
        if (!n) return nodes;
        const k = Math.sqrt((w * h) / n);
        let temp = w / 10;

        // Start on a circle so every page view gets the same layout.
        nodes.forEach((p, i) => {
            const a = (2 * Math.PI * i) / n;
            p.x = w / 2 + (w / 3) * Math.cos(a);
            p.y = h / 2 + (h / 3) * Math.sin(a);
        });

        for (let it = 0; it < iterations; it++) {
            nodes.forEach((p) => { p.dx = 0; p.dy = 0; });

            for (let i = 0; i < n; i++) {
                for (let j = i + 1; j < n; j++) {
                    const a = nodes[i], b = nodes[j];
                    const dx = a.x - b.x, dy = a.y - b.y;
                    const d = Math.hypot(dx, dy) || 0.01;
                    const f = (k * k) / d / d;
                    a.dx += dx * f; a.dy += dy * f;
                    b.dx -= dx * f; b.dy -= dy * f;
                }
            }

            edges.forEach(({ s, t }) => {
                const dx = s.x - t.x, dy = s.y - t.y;
                const f = Math.hypot(dx, dy) / k;
                s.dx -= dx * f; s.dy -= dy * f;
                t.dx += dx * f; t.dy += dy * f;
            });

            nodes.forEach((p) => {
                // Gravity acts like a link to the centre, so unlinked nodes stay about as close as the rest;
                // no frame, the view is fitted to the result.
                const g = Math.hypot(w / 2 - p.x, h / 2 - p.y) / k;
                p.dx += (w / 2 - p.x) * g;
                p.dy += (h / 2 - p.y) * g;
                const d = Math.hypot(p.dx, p.dy) || 0.01;
                const m = Math.min(d, temp);
                p.x += (p.dx / d) * m;
                p.y += (p.dy / d) * m;
            });

            temp = Math.max(temp * 0.98, 0.5);
        }

        return nodes;
    }

    if (typeof module !== 'undefined') {
        module.exports = { layout };
        return;
    }

    const data = window.linkMapForYoastSeo;
    const root = document.getElementById('link-map-for-yoast-seo');
    if (!data || !root) return;

    const t = data.i18n;
    if (!data.nodes.length) {
        root.textContent = t.empty;
        return;
    }

    const NS = 'http://www.w3.org/2000/svg';
    const el = (name, attrs = {}, parent) => {
        const node = name === 'svg' || ['g', 'line', 'circle', 'text', 'title', 'defs', 'marker', 'path'].includes(name)
            ? document.createElementNS(NS, name)
            : document.createElement(name);
        Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
        if (parent) parent.appendChild(node);
        return node;
    };

    // Fixed layout space, independent of the screen; the view is then fitted to the nodes.
    const W = 1000;
    const H = 700;
    const nodes = data.nodes.map((n) => ({ ...n, r: 5 + 2.5 * Math.sqrt(n.in), edges: [] }));
    const byId = new Map(nodes.map((n) => [n.id, n]));
    const edges = data.edges.map((e) => ({ s: byId.get(e.source), t: byId.get(e.target), n: e.n }));
    edges.forEach((e) => { e.s.edges.push(e); e.t.edges.push(e); });
    layout(nodes, edges, W, H);

    const groups = [...new Set(nodes.map((n) => n.group))];
    const color = (g) => `var(--lmys-c${groups.indexOf(g) % 8})`;
    // Labels for the most linked pages only; the others show theirs on hover or focus.
    const major = Math.max(2, [...nodes].sort((a, b) => b.in - a.in)[Math.min(9, nodes.length - 1)].in);

    // Toolbar: legend, search, zoom.
    const bar = el('div', { class: 'lmys-bar' }, root);
    const legend = el('ul', { class: 'lmys-legend' }, bar);
    groups.forEach((g) => {
        const li = el('li', {}, legend);
        li.style.setProperty('--lmys-dot', color(g));
        li.textContent = `${g} (${nodes.filter((n) => n.group === g).length})`;
    });
    el('li', { class: 'is-orphan' }, legend).textContent = t.orphan;

    const tools = el('div', { class: 'lmys-tools' }, bar);
    const search = el('input', { type: 'search', class: 'lmys-search', placeholder: t.search, 'aria-label': t.search }, tools);
    const button = (label, text) => {
        const b = el('button', { type: 'button', class: 'button', title: label, 'aria-label': label }, tools);
        b.textContent = text;
        return b;
    };
    const zoomOut = button(t.zoomOut, '−');
    const zoomIn = button(t.zoomIn, '+');
    const fitButton = button(t.fit, '⤢');

    const stage = el('div', { class: 'lmys-stage' }, root);
    const svg = el('svg', { class: 'lmys-graph', role: 'img', 'aria-label': t.graph }, stage);
    const marker = el('marker', { id: 'lmys-arrow', viewBox: '0 0 10 10', refX: 10, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, el('defs', {}, svg));
    el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'lmys-arrow' }, marker);

    const drawEdge = (e) => {
        // Stop the arrow at the edge of the target circle.
        const dx = e.t.x - e.s.x, dy = e.t.y - e.s.y, d = Math.hypot(dx, dy) || 1;
        e.line.setAttribute('x1', e.s.x);
        e.line.setAttribute('y1', e.s.y);
        e.line.setAttribute('x2', e.t.x - (dx / d) * (e.t.r + 2));
        e.line.setAttribute('y2', e.t.y - (dy / d) * (e.t.r + 2));
    };
    const place = (n) => {
        n.g.setAttribute('transform', `translate(${n.x},${n.y})`);
        n.edges.forEach(drawEdge);
    };

    const edgeLayer = el('g', {}, svg);
    edges.forEach((e) => {
        e.line = el('line', { class: 'lmys-edge', 'marker-end': 'url(#lmys-arrow)', 'stroke-width': Math.min(1 + (e.n - 1) * 0.5, 3) }, edgeLayer);
    });

    const nodeLayer = el('g', {}, svg);
    const byG = new Map();
    nodes.forEach((n) => {
        const cls = ['lmys-node', n.isPost && n.in === 0 ? 'is-orphan' : '', n.in >= major ? 'is-major' : ''].join(' ').trim();
        n.g = el('g', { class: cls, tabindex: 0 }, nodeLayer);
        byG.set(n.g, n);
        el('circle', { r: n.r, fill: color(n.group) }, n.g);
        el('title', {}, n.g).textContent = `${n.label}\n${counts(n)}\n${n.url}`;
        const label = el('text', { x: n.r + 4, y: 4 }, n.g);
        label.textContent = n.label.length > 40 ? n.label.slice(0, 39) + '…' : n.label;
        n.g.addEventListener('dblclick', () => { if (n.edit) window.location.href = n.edit; });
        n.g.addEventListener('keydown', (ev) => {
            if (ev.key === 'Enter' && n.edit && focused === n) window.location.href = n.edit;
            else if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); focus(n); }
        });
        place(n);
    });

    function counts(n) {
        return t.counts.replace('%1$d', n.in).replace('%2$d', n.out);
    }

    let focused = null;
    function focus(n, keep = false) {
        focused = focused === n && !keep ? null : n;
        svg.classList.toggle('is-focus', !!focused);
        const near = new Set(focused ? [focused] : []);
        edges.forEach((e) => {
            const on = !!focused && (e.s === focused || e.t === focused);
            e.line.classList.toggle('is-on', on);
            if (on) { near.add(e.s); near.add(e.t); }
        });
        nodes.forEach((m) => m.g.classList.toggle('is-on', near.has(m)));
    }

    // View: the SVG viewBox, fitted to the nodes, then zoomed and panned.
    const view = { x: 0, y: 0, w: W, h: H };
    const apply = () => svg.setAttribute('viewBox', `${view.x} ${view.y} ${view.w} ${view.h}`);
    const scale = () => view.w / (svg.clientWidth || W);

    function fit() {
        const m = 40;
        const x0 = Math.min(...nodes.map((n) => n.x - n.r)) - m;
        const y0 = Math.min(...nodes.map((n) => n.y - n.r)) - m;
        const x1 = Math.max(...nodes.map((n) => n.x + n.r)) + m + 80; // room for labels on the right
        const y1 = Math.max(...nodes.map((n) => n.y + n.r)) + m;
        const ratio = (stage.clientWidth || W) / (stage.clientHeight || H);
        let w = x1 - x0, h = y1 - y0;
        if (w / h < ratio) w = h * ratio; else h = w / ratio;
        Object.assign(view, { x: (x0 + x1 - w) / 2, y: (y0 + y1 - h) / 2, w, h });
        apply();
    }

    function zoom(factor, cx = view.x + view.w / 2, cy = view.y + view.h / 2) {
        const w = Math.min(Math.max(view.w / factor, W / 20), W * 4);
        const f = view.w / w;
        Object.assign(view, { x: cx - (cx - view.x) / f, y: cy - (cy - view.y) / f, w, h: view.h / f });
        apply();
    }

    const toView = (ev) => {
        const r = svg.getBoundingClientRect();
        return { x: view.x + (ev.clientX - r.left) * scale(), y: view.y + (ev.clientY - r.top) * scale() };
    };

    svg.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        const p = toView(ev);
        zoom(ev.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y);
    }, { passive: false });
    zoomIn.addEventListener('click', () => zoom(1.4));
    zoomOut.addEventListener('click', () => zoom(1 / 1.4));
    fitButton.addEventListener('click', fit);

    // One pointer handler: a drag on a node moves it, on the background pans; no movement is a click.
    let drag = null;
    svg.addEventListener('pointerdown', (ev) => {
        if (ev.button !== 0) return;
        const node = byG.get(ev.target.closest('.lmys-node'));
        drag = { node, cx: ev.clientX, cy: ev.clientY, x: node ? node.x : view.x, y: node ? node.y : view.y, moved: false };
        svg.setPointerCapture(ev.pointerId);
    });
    svg.addEventListener('pointermove', (ev) => {
        if (!drag) return;
        const dx = ev.clientX - drag.cx, dy = ev.clientY - drag.cy;
        if (!drag.moved && Math.hypot(dx, dy) < 4) return;
        drag.moved = true;
        svg.classList.add('is-dragging');
        if (drag.node) {
            drag.node.x = drag.x + dx * scale();
            drag.node.y = drag.y + dy * scale();
            place(drag.node);
        } else {
            view.x = drag.x - dx * scale();
            view.y = drag.y - dy * scale();
            apply();
        }
    });
    const release = () => {
        if (drag && !drag.moved) {
            if (drag.node) focus(drag.node);
            else if (focused) focus(focused);
        }
        drag = null;
        svg.classList.remove('is-dragging');
    };
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    search.addEventListener('input', () => {
        const q = search.value.trim().toLowerCase();
        const match = q && nodes.find((n) => n.label.toLowerCase().includes(q));
        if (!match) {
            if (focused) focus(focused);
            return;
        }
        focus(match, true);
        Object.assign(view, { x: match.x - view.w / 2, y: match.y - view.h / 2 });
        apply();
    });

    fit();
})();
