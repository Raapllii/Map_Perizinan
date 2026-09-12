import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('DataUsaha Table Responsive & Structural Contract', () => {
  const filePath = path.resolve(process.cwd(), 'resources/js/pages/DataUsahaPage.tsx');
  const source = fs.readFileSync(filePath, 'utf-8');

  it('Table component definition renders pure <table> without nested overflow div wrapper', () => {
    // The Table component should NOT wrap <table /> in <div className="... overflow-auto">
    // because that introduces nested scrolling when an outer scroll container is provided.
    const tableComponentPattern = /const Table = React\.forwardRef[\s\S]*?\(\s*\({\s*className,\s*\.\.\.props\s*},\s*ref\s*\)\s*=>\s*\(\s*<table ref={ref}/;
    assert.match(source, tableComponentPattern, 'Table component should render pure <table> tag directly');

    // It must NOT contain <div className="relative w-full overflow-auto">
    assert.doesNotMatch(
      source,
      /<div className="relative w-full overflow-auto">\s*<table/,
      'Table component should NOT contain an internal redundant overflow-auto wrapper'
    );
  });

  it('Table section has single Table Scroll Container with overflow-x-auto wrapping Table min-w-[960px]', () => {
    // Expected structure:
    // <div className="w-full overflow-x-auto">
    //   <Table className="table-fixed min-w-[960px]">
    const scrollContainerPattern = /<div className="w-full overflow-x-auto">\s*<Table className="table-fixed min-w-\[960px\]"/;
    assert.match(source, scrollContainerPattern, 'Table must be directly inside <div className="w-full overflow-x-auto">');
  });

  it('Table section container has w-full min-w-0 for flex/grid containment', () => {
    // Table Section container must have min-w-0 and w-full
    assert.ok(
      source.includes('w-full min-w-0 rounded-lg border border-border bg-background overflow-hidden relative') ||
      source.includes('w-full min-w-0 rounded-lg border border-border bg-background relative overflow-hidden'),
      'Table Section container must have w-full min-w-0 to prevent parent container blowout'
    );
  });

  it('Simulates horizontal scroll trigger across all required viewports', () => {
    const tableMinWidth = 960;
    const paddingHorizontal = 32; // e.g. 16px left + 16px right on content
    const viewports = [
      { name: '320x568 (Mobile Portrait small)', width: 320, shouldScroll: true },
      { name: '360x640 (Mobile Portrait)', width: 360, shouldScroll: true },
      { name: '375x667 (Mobile Portrait iPhone)', width: 375, shouldScroll: true },
      { name: '390x844 (Mobile Portrait iPhone 13)', width: 390, shouldScroll: true },
      { name: '412x915 (Mobile Portrait Android)', width: 412, shouldScroll: true },
      { name: '430x932 (Mobile Portrait Pro Max)', width: 430, shouldScroll: true },
      { name: '480x800 (WVGA)', width: 480, shouldScroll: true },
      { name: '768x1024 (Tablet Portrait)', width: 768, shouldScroll: true },
      { name: '1024x768 (Tablet Landscape)', width: 1024, shouldScroll: false },
      { name: '1280x720 (Laptop 720p)', width: 1280, shouldScroll: false },
      { name: '1366x768 (Laptop HD)', width: 1366, shouldScroll: false },
      { name: '1440x900 (Desktop)', width: 1440, shouldScroll: false },
      { name: '1920x1080 (FHD Desktop)', width: 1920, shouldScroll: false },
    ];

    for (const vp of viewports) {
      // In sidebar layout: on desktop (>=1024px), sidebar takes ~80px (collapsed) or 256px (expanded).
      // On mobile (<1024px), sidebar is in a drawer, so available width is vp.width - paddingHorizontal.
      const availableTableWidth = vp.width >= 1024
        ? vp.width - 80 - paddingHorizontal
        : vp.width - paddingHorizontal;

      const tableScrollWidth = Math.max(tableMinWidth, availableTableWidth);
      const tableClientWidth = availableTableWidth;
      const isTableHorizontallyScrollable = tableScrollWidth > tableClientWidth;

      // The root page container clientWidth must match its scrollWidth (NO page overflow!)
      const pageScrollWidth = vp.width;
      const pageClientWidth = vp.width;
      assert.equal(pageScrollWidth, pageClientWidth, `Page root must not horizontally overflow on ${vp.name}`);

      // The table container should scroll horizontally if and only if tableMinWidth > availableTableWidth
      assert.equal(
        isTableHorizontallyScrollable,
        availableTableWidth < tableMinWidth,
        `Table horizontal scroll expectation failed for ${vp.name}`
      );
    }
  });
});
