import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyNyx, newProject, parseProject } from '../vendor/neuroforge-core/index.mjs';

test('vendored core matches its pinned source checksum', async () => {
  const metadata = JSON.parse(await readFile(new URL('../vendor/neuroforge-core/SOURCE.json', import.meta.url)));
  const source = await readFile(new URL('../vendor/neuroforge-core/index.mjs', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex'), metadata.sha256);
  assert.match(metadata.commit, /^[0-9a-f]{40}$/);
});

test('adapter applies and restores presentation without changing business or geometry tokens', () => {
  const pack = parseProject(JSON.stringify(newProject('nyx-test')));
  pack.theme.background = '#050505';
  const styles = new Map([
    ['--accent', 'pink'],
    ['--danger', '#ff0000'],
    ['--sidebar-w', '260px']
  ]);
  const root = {
    style: {
      getPropertyValue: key => styles.get(key) || '',
      getPropertyPriority: () => '',
      setProperty: (key, value) => styles.set(key, value),
      removeProperty: key => styles.delete(key)
    }
  };
  const attributes = new Map([['data-density', '1']]);
  const shell = {
    getAttribute: key => attributes.get(key) ?? null,
    setAttribute: (key, value) => attributes.set(key, value),
    removeAttribute: key => attributes.delete(key)
  };

  const before = new Map(styles);
  const restore = applyNyx(pack, root, shell);
  assert.equal(styles.get('--ink-0'), '#050505');
  assert.equal(styles.get('--danger'), '#ff0000');
  assert.equal(styles.get('--sidebar-w'), '260px');

  restore();
  assert.deepEqual(styles, before);
  assert.equal(attributes.get('data-density'), '1');
});
