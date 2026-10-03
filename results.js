(() => {
  'use strict';

  const colors = { teacher: '#9aa8b3', baseline: '#7c95ae', ours: '#2c6e7f' };
  const configurations = {
    methods: {
      imagenet: { columns: [1], label: 'DINOv2-L · ImageNet-1K · 512²', unit: 'Top-1 accuracy (%)', direction: 'Higher is better', percent: true },
      ade20k: { columns: [2], label: 'DINOv2-L · ADE20K · 512²', unit: 'mIoU', direction: 'Higher is better', percent: true }
    },
    backbones: {
      imagenet: { columns: [1, 2], label: 'Across backbones · ImageNet-1K · 512²', unit: 'Top-1 accuracy (%)', direction: 'Higher is better', percent: true },
      ade20k: { columns: [3, 4], label: 'Across backbones · ADE20K · 512²', unit: 'mIoU', direction: 'Higher is better', percent: true },
      cityscapes: { columns: [5, 6], label: 'Across backbones · Cityscapes · 1024²', unit: 'mIoU', direction: 'Higher is better', percent: true }
    },
    cityscapes: {
      miou512: { columns: [1], label: 'DINOv2-L · Cityscapes · 512²', unit: 'mIoU', direction: 'Higher is better', percent: true },
      miou1024: { columns: [2], label: 'DINOv2-L · Cityscapes · 1024²', unit: 'mIoU', direction: 'Higher is better', percent: true },
      throughput: { columns: [3], label: 'DINOv2-L · Cityscapes · 1024² · Batch size 1', unit: 'Throughput (images/s)', direction: 'Higher is better' },
      memory: { columns: [4], label: 'DINOv2-L · Cityscapes · 1024² · Batch size 1', unit: 'Peak memory (GB)', direction: 'Lower is better' }
    },
    ablation: {
      ade20k: { columns: [3], label: 'Stage ablation · DINOv2-L · ADE20K', unit: 'mIoU', direction: 'Higher is better', percent: true },
      samhq: { columns: [4], label: 'Stage ablation · SAM-H · SAM-HQ', unit: 'IoU', direction: 'Higher is better', percent: true }
    }
  };

  const svgElement = (name, attributes, content) => {
    const element = document.createElementNS('http://www.w3.org/2000/svg', name);
    Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
    if (content !== undefined) element.textContent = content;
    return element;
  };

  document.querySelectorAll('[data-result-chart]').forEach((card, chartIndex) => {
    const type = card.dataset.resultChart;
    const select = card.querySelector('select');
    const table = card.querySelector('table');
    const plot = card.querySelector('.chart-plot');
    const tooltip = card.querySelector('.chart-tooltip');
    if (!configurations[type] || !table || !select || !plot || !tooltip) return;

    // The existing exact-data table is the only source of result values.
    const rows = Array.from(table.tBodies[0].rows, (row) => Array.from(row.cells, (cell) => cell.textContent.trim()));
    const grouped = type === 'backbones';
    const legend = card.querySelector('.chart-legend');
    const legendEntries = type === 'ablation'
      ? [['No alignment', colors.teacher], ['Single stage', colors.baseline], ['Stage 1 + Stage 2', colors.ours]]
      : grouped
        ? [['Softmax teacher', colors.teacher], ['ViT-AdaLA', colors.ours]]
        : [['Softmax teacher', colors.teacher], ['Native baselines', colors.baseline], ['ViT-AdaLA', colors.ours]];
    legendEntries.forEach(([name, color]) => {
      const item = document.createElement('span');
      const swatch = document.createElement('i');
      swatch.style.backgroundColor = color;
      swatch.setAttribute('aria-hidden', 'true');
      item.append(swatch, document.createTextNode(name));
      legend.append(item);
    });

    let focusedTooltip = null;
    const hideTooltip = () => { tooltip.hidden = true; };
    const showTooltip = (category, series, value, metric, x, y) => {
      const heading = document.createElement('strong');
      heading.textContent = grouped ? `${category} · ${series}` : category;
      const detail = document.createElement('span');
      detail.textContent = `${value} · ${metric.unit}`;
      tooltip.replaceChildren(heading, detail);
      tooltip.hidden = false;
      const left = Math.max(8, Math.min(x + 14, window.innerWidth - tooltip.offsetWidth - 8));
      const top = y + tooltip.offsetHeight + 24 > window.innerHeight ? y - tooltip.offsetHeight - 12 : y + 14;
      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${Math.max(8, top)}px`;
    };

    const render = () => {
      hideTooltip();
      focusedTooltip = null;
      const metric = configurations[type][select.value];
      const context = `${metric.label} · ${metric.unit} · ${metric.direction}`;
      card.querySelector('.chart-context').textContent = context;
      const data = rows.map((row) => ({
        category: row[0],
        values: metric.columns.map((column) => {
          const raw = row[column];
          return { raw, number: /^\d+(\.\d+)?$/.test(raw) ? Number(raw) : null };
        })
      })).filter((item) => !grouped || item.values.some((value) => value.number !== null));
      if (grouped) {
        // Keep the expanded table in sync with the dataset and visible backbones.
        const header = document.createElement('tr');
        ['Backbone', 'Softmax teacher', 'ViT-AdaLA'].forEach((name) => {
          const cell = document.createElement('th');
          cell.scope = 'col';
          cell.textContent = name;
          header.append(cell);
        });
        table.tHead.replaceChildren(header);
        const tableRows = data.map((item) => {
          const row = document.createElement('tr');
          const heading = document.createElement('th');
          heading.scope = 'row';
          heading.textContent = item.category;
          row.append(heading);
          item.values.forEach((value, index) => {
            const cell = document.createElement('td');
            if (index === 1 && value.number !== null) {
              const emphasis = document.createElement('strong');
              emphasis.textContent = value.raw;
              cell.append(emphasis);
            } else cell.textContent = value.raw;
            row.append(cell);
          });
          return row;
        });
        table.tBodies[0].replaceChildren(...tableRows);
        const caption = table.caption || table.createCaption();
        caption.textContent = `${metric.label} · ${metric.unit}`;
      }
      const present = data.flatMap((item) => item.values.map((value) => value.number)).filter((value) => value !== null);
      const largest = Math.max(0, ...present);
      const roughStep = Math.max(largest / 5, .01);
      const magnitude = 10 ** Math.floor(Math.log10(roughStep));
      const step = [1, 2, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= roughStep);
      const maximum = metric.percent ? 100 : Math.max(step, Math.ceil(largest / step) * step);
      const tickStep = metric.percent ? 20 : step;
      const chartWidth = Math.max(640, card.querySelector('.chart-viewport').clientWidth);
      const dimensions = { width: chartWidth, height: 390, left: 62, right: 20, top: 35, bottom: 305 };
      const availableWidth = dimensions.width - dimensions.left - dimensions.right;
      const groupWidth = availableWidth / Math.max(1, data.length);
      const plotHeight = dimensions.bottom - dimensions.top;
      const titleId = `result-chart-title-${chartIndex}`;
      const descriptionId = `result-chart-description-${chartIndex}`;
      const svg = svgElement('svg', { viewBox: `0 0 ${dimensions.width} ${dimensions.height}`, class: 'chart-svg', role: 'group', 'aria-labelledby': `${titleId} ${descriptionId}` });
      svg.append(svgElement('title', { id: titleId }, context));
      svg.append(svgElement('desc', { id: descriptionId }, 'Use Tab or arrow keys to explore bars. Missing values are not plotted. Exact results are available in the data table below.'));

      for (let tick = 0; tick <= maximum + tickStep / 100; tick += tickStep) {
        const y = dimensions.bottom - (tick / maximum) * plotHeight;
        svg.append(svgElement('line', { x1: dimensions.left, x2: dimensions.width - dimensions.right, y1: y, y2: y, class: 'chart-grid' }));
        svg.append(svgElement('text', { x: dimensions.left - 12, y: y + 5, 'text-anchor': 'end', class: 'chart-tick' }, Number(tick.toFixed(3)).toString()));
      }

      data.forEach(({ category, values }, categoryIndex) => {
        const center = dimensions.left + groupWidth * (categoryIndex + .5);
        const barWidth = Math.min(grouped ? 46 : 74, groupWidth / (grouped ? 3.5 : 2));
        const barGap = grouped ? 10 : 0;
        const totalWidth = values.length * barWidth + (values.length - 1) * barGap;
        values.forEach(({ raw, number }, seriesIndex) => {
          const x = center - totalWidth / 2 + seriesIndex * (barWidth + barGap);
          const series = grouped ? (seriesIndex === 0 ? 'Softmax teacher' : 'ViT-AdaLA') : category;
          if (number === null) {
            svg.append(svgElement('text', { x: x + barWidth / 2, y: dimensions.bottom - 14, 'text-anchor': 'middle', class: 'chart-missing', 'aria-label': `${category}, ${series}: not shown` }, '—'));
            return;
          }
          const height = (number / maximum) * plotHeight;
          const y = dimensions.bottom - height;
          const isReference = series === 'Softmax teacher' || (type === 'ablation' && category === 'No alignment');
          const isOurs = series === 'ViT-AdaLA' || (type === 'ablation' && category === 'Stage 1 + Stage 2');
          const color = isReference ? colors.teacher : isOurs ? colors.ours : colors.baseline;
          const bar = svgElement('g', { class: 'chart-bar', tabindex: '0', role: 'img', 'data-chart-bar': '', 'aria-label': `${category}${grouped ? `, ${series}` : ''}: ${raw} ${metric.unit}` });
          bar.append(svgElement('title', {}, `${category}${grouped ? ` · ${series}` : ''}: ${raw} ${metric.unit}`));
          bar.append(svgElement('rect', { x, y, width: barWidth, height, rx: 3, fill: color }));
          bar.append(svgElement('text', { x: x + barWidth / 2, y: y - 10, 'text-anchor': 'middle', class: 'chart-value' }, raw));
          const pointerTooltip = (event) => showTooltip(category, series, raw, metric, event.clientX, event.clientY);
          const focusTooltip = () => {
            const bounds = bar.getBoundingClientRect();
            showTooltip(category, series, raw, metric, bounds.left + bounds.width / 2, bounds.top);
          };
          bar.addEventListener('pointerenter', pointerTooltip);
          bar.addEventListener('pointermove', pointerTooltip);
          bar.addEventListener('pointerleave', hideTooltip);
          bar.addEventListener('focus', () => { focusedTooltip = focusTooltip; focusTooltip(); });
          bar.addEventListener('blur', () => { focusedTooltip = null; hideTooltip(); });
          bar.addEventListener('click', focusTooltip);
          bar.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') hideTooltip();
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault();
              const bars = Array.from(svg.querySelectorAll('[data-chart-bar]'));
              const offset = event.key === 'ArrowRight' ? 1 : -1;
              bars[(bars.indexOf(bar) + offset + bars.length) % bars.length].focus();
            }
          });
          svg.append(bar);
        });
        const label = svgElement('text', { x: center, y: dimensions.bottom + 30, 'text-anchor': 'middle', class: 'chart-category' });
        const lines = category.endsWith(' (native)') ? [category.slice(0, -9), '(native)'] : [category];
        lines.forEach((line, index) => label.append(svgElement('tspan', { x: center, dy: index ? 18 : 0 }, line)));
        svg.append(label);
      });
      plot.replaceChildren(svg);
    };

    card.querySelector('.interactive-chart').hidden = false;
    render();
    select.addEventListener('change', render);
    window.addEventListener('scroll', () => {
      if (focusedTooltip && !tooltip.hidden) focusedTooltip();
      else hideTooltip();
    }, { passive: true, capture: true });
    let resizeFrame;
    window.addEventListener('resize', () => {
      hideTooltip();
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(render);
    });
    document.addEventListener('pointerdown', (event) => {
      if (!card.contains(event.target)) hideTooltip();
    });
    card.querySelector('.chart-data').open = false;
  });
})();
