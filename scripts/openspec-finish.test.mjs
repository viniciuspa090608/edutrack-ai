import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { finish, execute } from './openspec-finish.mjs';

function fixture(t, delta = false) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'edutrack-finish-'));
  t.after(() => {
    assert.equal(path.dirname(path.resolve(cwd)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(cwd).startsWith('edutrack-finish-'));
    fs.rmSync(cwd, { recursive: true, force: true });
  });
  const git = (...args) => execute('git', args, cwd);
  const write = (p, value) => {
    fs.mkdirSync(path.dirname(path.join(cwd, p)), { recursive: true });
    fs.writeFileSync(path.join(cwd, p), value);
  };
  git('init', '-b', 'master');
  git('config', 'user.name', 'Workflow Test');
  git('config', 'user.email', 'workflow@example.test');
  write('.gitignore', '.openspec-local/\n');
  write('unrelated.txt', 'baseline\n');
  git('add', '--', '.gitignore', 'unrelated.txt');
  git('commit', '-m', '[make] fixture');
  const base = git('rev-parse', 'HEAD');
  const active = 'openspec/changes/example';
  const tasks = `${active}/tasks.md`;
  write(tasks, '# Tasks\n- [x] 1.1 Implementado e verificado\n');
  write(`${active}/proposal.md`, '# Proposal\n');
  write(
    `${active}/.openspec.yaml`,
    `schema: spec-driven\n${delta ? '' : 'skip_specs: true\n'}`,
  );
  write('feature.txt', 'new feature\n');
  const plan = {
    paths: [
      'feature.txt',
      tasks,
      `${active}/proposal.md`,
      `${active}/.openspec.yaml`,
    ],
    sync: [],
  };
  if (delta) {
    write(`${active}/specs/example/spec.md`, '# Delta\n');
    plan.paths.push(`${active}/specs/example/spec.md`);
    write(
      '.openspec-local/reviewed/example.md',
      '# example Specification\n## Purpose\nDefine a deterministic fixture capability for testing the complete OpenSpec lifecycle.\n## Requirements\n### Requirement: Example\nSystem SHALL work.\n#### Scenario: Works\n- **WHEN** invoked\n- **THEN** works\n',
    );
    plan.sync.push({
      path: 'openspec/specs/example/spec.md',
      source: '.openspec-local/reviewed/example.md',
      reviewed: true,
    });
  }
  const manifest = '.openspec-local/manifest.json';
  const savePlan = () => write(manifest, JSON.stringify(plan));
  savePlan();
  const calls = [];
  const run = (command, args, directory, capture) => {
    calls.push([command, ...args]);
    if (command === 'git') return execute(command, args, directory, capture);
    if (command === 'pnpm') return '';
    if (args[0] === 'status')
      return JSON.stringify({
        planningHome: { root: cwd },
        changeRoot: path.join(cwd, active),
        artifacts: [{ id: 'tasks', status: 'done' }],
        artifactPaths: {
          specs: {
            existingOutputPaths: delta
              ? [path.join(cwd, active, 'specs/example/spec.md')]
              : [],
          },
        },
      });
    if (args[0] === 'instructions')
      return JSON.stringify({ artifactId: 'specs' });
    if (args[0] === 'archive') {
      const journal = JSON.parse(
        fs.readFileSync(path.join(cwd, '.openspec-local/example.json')),
      );
      fs.mkdirSync(path.dirname(path.join(cwd, journal.archive)), {
        recursive: true,
      });
      fs.renameSync(path.join(cwd, active), path.join(cwd, journal.archive));
    }
    return '';
  };
  const options = {
    cwd,
    change: 'example',
    manifest,
    message: '[feat] exemplo',
    run,
  };
  return { cwd, git, write, plan, savePlan, calls, options, base, active };
}

for (const delta of [false, true])
  test(`conclusão ${delta ? 'com sync revisado' : 'skip_specs'} cria um commit e preserva trabalho alheio`, (t) => {
    const f = fixture(t, delta);
    f.write('unrelated.txt', 'preexisting edit\n');
    f.write('untracked.txt', 'preexisting untracked\n');
    const result = finish(f.options);
    assert.equal(result.phase, 'done');
    assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
    assert.equal(f.git('show', 'HEAD:unrelated.txt'), 'baseline');
    assert.equal(
      fs.readFileSync(path.join(f.cwd, 'unrelated.txt'), 'utf8'),
      'preexisting edit\n',
    );
    assert.equal(fs.existsSync(path.join(f.cwd, f.active)), false);
    assert.match(f.git('show', `HEAD:${result.archive}/tasks.md`), /\[x\]/);
    if (delta)
      assert.match(
        f.git('show', 'HEAD:openspec/specs/example/spec.md'),
        /System SHALL work/,
      );
    assert.equal(f.calls.filter(([cmd]) => cmd === 'pnpm').length, 4);
    assert.equal(
      f.calls.some(([, op]) => op === 'push'),
      false,
    );
    assert.equal(finish(f.options).repeated, true);
  });

for (const phase of [
  'after-commit',
  'after-sync',
  'after-archive',
  'before-amend',
])
  test(`retoma falha em ${phase} sem duplicar commits`, (t) => {
    const f = fixture(t, true);
    assert.throws(
      () =>
        finish({
          ...f.options,
          checkpoint: (p) => {
            if (p === phase) throw new Error('interrompido');
          },
        }),
      /interrompido/,
    );
    assert.equal(finish(f.options).phase, 'done');
    assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
  });

test('inspeção não cria commit, journal ou archive', (t) => {
  const f = fixture(t);
  assert.equal(finish({ ...f.options, inspect: true }).phase, 'inspect');
  assert.equal(f.git('rev-parse', 'HEAD'), f.base);
  assert.equal(
    fs.existsSync(path.join(f.cwd, '.openspec-local/example.json')),
    false,
  );
});

test('recusa nomes e paths inválidos, diretórios e staged alheio', (t) => {
  const f = fixture(t);
  assert.throws(
    () => finish({ ...f.options, change: '../oops' }),
    /kebab-case/,
  );
  f.plan.paths.push('../outside');
  f.savePlan();
  assert.throws(() => finish(f.options), /fora do workspace/);
  f.plan.paths.pop();
  f.plan.paths.push('openspec');
  f.savePlan();
  assert.throws(() => finish(f.options), /não diretórios/);
  f.plan.paths.pop();
  f.savePlan();
  f.write('unrelated.txt', 'changed');
  f.git('add', '--', 'unrelated.txt');
  assert.throws(() => finish(f.options), /Staged contém/);
  assert.equal(f.git('rev-parse', 'HEAD'), f.base);
});

test('recusa tarefas com qualquer marcador incompleto', (t) => {
  const f = fixture(t);
  for (const marker of [' ', '~', '-', '']) {
    f.write(`${f.active}/tasks.md`, `- [${marker}] incomplete\n`);
    assert.throws(() => finish(f.options), /Tarefas incompletas/);
  }
});

test('falha de qualidade não cria commit e permite retomada', (t) => {
  const f = fixture(t);
  assert.throws(
    () =>
      finish({
        ...f.options,
        run: (cmd, args, ...rest) => {
          if (cmd === 'pnpm' && args[0] === 'test')
            throw new Error('MySQL indisponível');
          return f.options.run(cmd, args, ...rest);
        },
      }),
    /MySQL indisponível/,
  );
  assert.equal(f.git('rev-parse', 'HEAD'), f.base);
  assert.equal(finish(f.options).phase, 'done');
});

test('recusa destino existente e plano sync não revisado/incompleto', (t) => {
  const f = fixture(t, true);
  f.plan.sync[0].reviewed = false;
  f.savePlan();
  assert.throws(() => finish(f.options), /revisão semântica/);
  f.plan.sync[0].reviewed = true;
  const item = f.plan.sync.pop();
  f.savePlan();
  assert.throws(() => finish(f.options), /exatamente/);
  f.plan.sync.push(item);
  f.savePlan();
  const preview = finish({ ...f.options, inspect: true });
  f.write(`${preview.archive}/already.txt`, 'existing');
  assert.throws(() => finish(f.options), /Destino do archive já existe/);
});

test('HEAD trocado e alterações nos artefatos bloqueiam retomada', (t) => {
  const f = fixture(t);
  assert.throws(
    () =>
      finish({
        ...f.options,
        checkpoint: () => {
          throw new Error('pause');
        },
      }),
    /pause/,
  );
  f.write('feature.txt', 'third party');
  assert.throws(() => finish(f.options), /Implementação mudou/);
  f.write('feature.txt', 'new feature\n');
  f.write('other.txt', 'other');
  f.git('add', '--', 'other.txt');
  f.git('commit', '-m', '[update] outro');
  assert.throws(() => finish(f.options), /HEAD mudou/);
});

test('recusa commit publicado em bare remoto real', (t) => {
  const f = fixture(t);
  const remote = path.join(f.cwd, 'remote.git');
  execute('git', ['init', '--bare', remote], f.cwd);
  f.git('remote', 'add', 'origin', remote);
  assert.throws(
    () =>
      finish({
        ...f.options,
        checkpoint: (p) => {
          if (p === 'after-commit') throw new Error('pause');
        },
      }),
    /pause/,
  );
  f.git('push', 'origin', 'HEAD:refs/heads/master');
  assert.throws(() => finish(f.options), /já publicado/);
  assert.equal(fs.existsSync(path.join(f.cwd, f.active)), true);
});

test('verifica publicação novamente imediatamente antes do amend', (t) => {
  const f = fixture(t);
  const remote = path.join(f.cwd, 'remote.git');
  execute('git', ['init', '--bare', remote], f.cwd);
  f.git('remote', 'add', 'origin', remote);
  assert.throws(
    () =>
      finish({
        ...f.options,
        checkpoint: (phase) => {
          if (phase === 'after-archive')
            f.git('push', 'origin', 'HEAD:refs/heads/master');
        },
      }),
    /já publicado/,
  );
  assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
});

test('lock existente bloqueia sem criar commit', (t) => {
  const f = fixture(t);
  f.write('.openspec-local/finish.lock', 'other process');
  assert.throws(() => finish(f.options), /lock/);
  assert.equal(f.git('rev-parse', 'HEAD'), f.base);
});

test('não cria commit vazio ao receber implementação já versionada fora do journal', (t) => {
  const f = fixture(t);
  f.git('add', '--', ...f.plan.paths);
  f.git('commit', '-m', '[feat] já salvo');
  const head = f.git('rev-parse', 'HEAD');
  assert.throws(() => finish(f.options), /Sem diff novo/);
  assert.equal(f.git('rev-parse', 'HEAD'), head);
});

test('snapshot revisado alterado e specs concorrentes bloqueiam retomada', (t) => {
  const f = fixture(t, true);
  assert.throws(
    () =>
      finish({
        ...f.options,
        checkpoint: () => {
          throw new Error('pause');
        },
      }),
    /pause/,
  );
  const source = fs.readFileSync(path.join(f.cwd, f.plan.sync[0].source));
  f.write(f.plan.sync[0].source, 'changed');
  assert.throws(() => finish(f.options), /Snapshot revisado/);
  f.write(f.plan.sync[0].source, source);
  f.write('openspec/specs/example/spec.md', 'concurrent');
  assert.throws(() => finish(f.options), /Spec principal mudou/);
});

test('aposentadoria exige autorização e remoção de todos os requisitos', (t) => {
  const f = fixture(t, true);
  const target = f.plan.sync[0].path;
  f.write(
    target,
    '# example Specification\n\n## Purpose\n\nDefine the existing capability before its explicit retirement.\n\n## Requirements\n\n### Requirement: Example\nSystem SHALL work.\n\n#### Scenario: Works\n- **WHEN** invoked\n- **THEN** works\n',
  );
  f.git('add', '--', target);
  f.git('commit', '-m', '[make] base spec');
  f.plan.sync[0].source = null;
  f.savePlan();
  f.write(
    `${f.active}/specs/example/spec.md`,
    '# Spec Delta\n\n## REMOVED Requirements\n\n### Requirement: Example\n**Reason**: Retirement.\n**Migration**: No replacement.\n',
  );
  assert.throws(() => finish(f.options), /retire_capabilities/);
  f.write(
    `${f.active}/.openspec.yaml`,
    'schema: spec-driven\nretire_capabilities: true\n',
  );
  assert.equal(finish(f.options).phase, 'done');
  assert.equal(fs.existsSync(path.join(f.cwd, target)), false);
});

test('reconcilia interrupção entre git commit e gravação do journal', (t) => {
  const f = fixture(t);
  let crashed = false;
  const run = (cmd, args, ...rest) => {
    const result = f.options.run(cmd, args, ...rest);
    if (!crashed && cmd === 'git' && args[0] === 'commit') {
      crashed = true;
      throw new Error('crash após commit');
    }
    return result;
  };
  assert.throws(() => finish({ ...f.options, run }), /crash após commit/);
  assert.equal(finish(f.options).phase, 'done');
  assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
});

test('reconcilia interrupção entre amend e gravação do journal', (t) => {
  const f = fixture(t);
  const run = (cmd, args, ...rest) => {
    const result = f.options.run(cmd, args, ...rest);
    if (cmd === 'git' && args.includes('--amend'))
      throw new Error('crash após amend');
    return result;
  };
  assert.throws(() => finish({ ...f.options, run }), /crash após amend/);
  assert.equal(finish(f.options).phase, 'done');
  assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
});

for (const delta of [false, true])
  test(`integração com CLI OpenSpec instalada: ${delta ? 'delta' : 'skip_specs'}`, (t) => {
    const f = fixture(t, delta);
    f.write('openspec/config.yaml', 'schema: spec-driven\n');
    f.write(
      `${f.active}/design.md`,
      '# Design\n\n## Decisions\n\nA fixture exercises the installed CLI.\n',
    );
    f.plan.paths.push(`${f.active}/design.md`, 'openspec/config.yaml');
    if (delta) {
      f.write(
        `${f.active}/specs/example/spec.md`,
        '# Spec Delta\n\n## Purpose\n\nDefine the fixture capability.\n\n## ADDED Requirements\n\n### Requirement: Example\nSystem SHALL work.\n\n#### Scenario: Works\n- **WHEN** invoked\n- **THEN** works\n',
      );
    }
    f.savePlan();
    const run = (cmd, args, cwd, capture) =>
      cmd === 'pnpm' ? '' : execute(cmd, args, cwd, capture);
    assert.equal(finish({ ...f.options, run }).phase, 'done');
    assert.equal(f.git('rev-list', '--count', `${f.base}..HEAD`), '1');
  });
