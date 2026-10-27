import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const hash = (value) => createHash('sha256').update(value).digest('hex');
const read = (p) => (fs.existsSync(p) ? fs.readFileSync(p) : null);
const fingerprint = (p) => {
  const value = read(p);
  return value === null ? null : hash(value);
};
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
function assert(ok, message) {
  if (!ok) throw new Error(message);
}

export function execute(command, args, cwd, capture = true) {
  // Only fixed command/flag/name tokens reach Windows .cmd shims; paths stay in cwd.
  const windowsShim =
    process.platform === 'win32' && ['pnpm', 'openspec'].includes(command);
  let executable = command;
  let parameters = args;
  if (windowsShim) {
    for (const arg of args)
      assert(
        /^[a-zA-Z0-9_:/=.-]+$/.test(arg),
        'Argumento inseguro para shim Windows.',
      );
    executable = process.env.ComSpec || 'cmd.exe';
    parameters = ['/d', '/s', '/c', `${command} ${args.join(' ')}`];
  }
  const result = spawnSync(executable, parameters, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    windowsHide: true,
    env:
      command === 'openspec'
        ? { ...process.env, TZ: 'America/Sao_Paulo' }
        : process.env,
  });
  if (result.error || result.status !== 0) {
    // Child output stays at the originating command; do not copy credentials/stacks to a journal.
    throw new Error(
      `Falhou: ${command} ${args[0] ?? ''} (exit ${result.status ?? 'indisponível'}).${capture ? `\n${result.stderr || result.error?.message || ''}` : ''}`,
    );
  }
  return result.stdout?.trim() ?? '';
}

function files(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(root, entry.name);
    assert(!entry.isSymbolicLink(), 'Symlinks não são aceitos no manifesto.');
    return entry.isDirectory() ? files(target) : [target];
  });
}

export function finish({
  cwd = process.cwd(),
  change,
  manifest,
  message,
  inspect = false,
  run = execute,
  checkpoint = () => {},
}) {
  assert(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(change ?? ''),
    'Informe --change com um nome kebab-case.',
  );
  const git = (...args) => run('git', args, cwd);
  assert(
    path.resolve(git('rev-parse', '--show-toplevel')).toLowerCase() ===
      path.resolve(cwd).toLowerCase(),
    'Execute na raiz do Git.',
  );
  const local = path.join(cwd, '.openspec-local');
  const statePath = path.join(local, `${change}.json`);
  const active = `openspec/changes/${change}`;
  const safe = (relative) => {
    assert(
      typeof relative === 'string' &&
        relative.length > 0 &&
        !relative.includes('\\') &&
        !relative.includes('\0') &&
        !relative.startsWith('-'),
      'Path inválido no manifesto.',
    );
    const full = path.resolve(cwd, relative);
    assert(
      full.startsWith(path.resolve(cwd) + path.sep) &&
        !relative.split('/').includes('..') &&
        !relative.startsWith('.git/'),
      'Path fora do workspace.',
    );
    let cursor = full;
    while (cursor !== path.resolve(cwd)) {
      if (fs.existsSync(cursor))
        assert(
          !fs.lstatSync(cursor).isSymbolicLink(),
          'Symlink fora do escopo.',
        );
      cursor = path.dirname(cursor);
    }
    return full;
  };
  const snapshot = (paths) =>
    Object.fromEntries(paths.map((p) => [p, fingerprint(safe(p))]));
  const changed = (staged = false) =>
    git(
      'diff',
      ...(staged ? ['--cached'] : []),
      '--name-only',
      '-z',
      '--no-renames',
    )
      .split('\0')
      .filter(Boolean);
  const checkIndex = (allowed) =>
    assert(
      changed(true).every((p) => allowed.includes(p)),
      'Staged contém arquivos alheios ao manifesto.',
    );
  const save = (state) => {
    const temporary = `${statePath}.tmp`;
    fs.writeFileSync(temporary, JSON.stringify(state, null, 2) + '\n');
    fs.renameSync(temporary, statePath);
  };
  let state = fs.existsSync(statePath)
    ? JSON.parse(fs.readFileSync(statePath, 'utf8'))
    : null;
  const initialHead = git('rev-parse', 'HEAD');
  if (state?.phase === 'done') {
    assert(
      !fs.existsSync(safe(active)) && fs.existsSync(safe(state.archive)),
      'Archive concluído foi alterado.',
    );
    assert(
      equal(snapshot(state.finalPaths), state.finalSnapshot),
      'Arquivos da conclusão foram modificados.',
    );
    assert(
      git('merge-base', '--is-ancestor', state.finalHead, 'HEAD') === '',
      'Commit final ausente do histórico.',
    );
    return {
      phase: 'done',
      commit: state.finalHead,
      archive: state.archive,
      repeated: true,
    };
  }
  const beforeCommit = !state || state.phase === 'prepared';
  if (beforeCommit) {
    assert(
      manifest || state,
      'Informe --manifest com paths e sync revisados pelo agente.',
    );
    const plan = manifest
      ? JSON.parse(fs.readFileSync(path.resolve(cwd, manifest), 'utf8'))
      : state.plan;
    assert(
      Array.isArray(plan.paths) &&
        plan.paths.length > 0 &&
        new Set(plan.paths).size === plan.paths.length,
      'Manifesto paths vazio ou duplicado.',
    );
    assert(
      Array.isArray(plan.sync),
      'Manifesto deve declarar sync (array vazio para skip_specs).',
    );
    plan.paths.forEach((p) => {
      const target = safe(p);
      assert(
        !fs.existsSync(target) || fs.lstatSync(target).isFile(),
        'Paths deve listar arquivos, não diretórios.',
      );
    });
    assert(
      plan.paths.every((p) => !p.startsWith('.openspec-local/')),
      'Journal não pode entrar no commit.',
    );
    const status = JSON.parse(
      run('openspec', ['status', '--change', change, '--json'], cwd),
    );
    assert(
      path.resolve(status.planningHome.root) === path.resolve(cwd) &&
        path.resolve(status.changeRoot) === safe(active),
      'Somente mudanças repo-local são suportadas.',
    );
    assert(
      status.artifacts.every((a) => ['done', 'skipped'].includes(a.status)),
      'Artefatos incompletos.',
    );
    const tasks =
      fs
        .readFileSync(safe(`${active}/tasks.md`), 'utf8')
        .match(/^\s*-\s+\[([^\]]*)\].*$/gm) ?? [];
    assert(
      tasks.length > 0 &&
        tasks.every((line) => /^\s*-\s+\[\s*[xX]\s*\]/.test(line)),
      'Tarefas incompletas.',
    );
    const deltaPaths = status.artifactPaths.specs?.existingOutputPaths ?? [];
    if (deltaPaths.length) {
      const instructions = JSON.parse(
        run(
          'openspec',
          ['instructions', 'specs', '--change', change, '--json'],
          cwd,
        ),
      );
      assert(
        instructions.artifactId === 'specs',
        'Instruções specs inválidas.',
      );
    }
    const expected = deltaPaths
      .map(
        (p) =>
          `openspec/specs/${path
            .relative(safe(`${active}/specs`), p)
            .split(path.sep)
            .join('/')}`,
      )
      .sort();
    assert(
      equal(plan.sync.map((s) => s.path).sort(), expected),
      'Sync deve cobrir exatamente todas as capacidades delta.',
    );
    for (const item of plan.sync) {
      safe(item.path);
      assert(
        item.reviewed === true,
        'Sync precisa de revisão semântica do agente.',
      );
      if (item.source !== null) {
        assert(
          typeof item.source === 'string' &&
            item.source.startsWith('.openspec-local/'),
          'Snapshot de sync deve ficar em .openspec-local/.',
        );
        safe(item.source);
        assert(read(safe(item.source)) !== null, 'Snapshot sync ausente.');
      } else {
        const metadata = fs.readFileSync(
          safe(`${active}/.openspec.yaml`),
          'utf8',
        );
        const deltaPath = deltaPaths.find(
          (p) =>
            `openspec/specs/${path
              .relative(safe(`${active}/specs`), p)
              .split(path.sep)
              .join('/')}` === item.path,
        );
        const delta = fs.readFileSync(deltaPath, 'utf8');
        const current = read(safe(item.path))?.toString('utf8') ?? '';
        const requirements = (text) =>
          [...text.matchAll(/^### Requirement: (.+)$/gm)].map((m) =>
            m[1].trim(),
          );
        assert(
          /^retire_capabilities:\s*true\s*$/m.test(metadata),
          'Aposentadoria exige retire_capabilities: true.',
        );
        assert(
          /^## REMOVED Requirements\s*$/m.test(delta) &&
            !/^## (ADDED|MODIFIED|RENAMED) Requirements/m.test(delta),
          'Aposentadoria exige somente requisitos REMOVED.',
        );
        assert(
          /^## Purpose\s*$/m.test(current) &&
            requirements(current).length > 0 &&
            requirements(current).every((name) =>
              requirements(delta).includes(name),
            ),
          'Aposentadoria deve remover todos os requisitos existentes.',
        );
        assert(
          [...current.matchAll(/^## (.+)$/gm)].every((m) =>
            ['Purpose', 'Requirements'].includes(m[1].trim()),
          ),
          'Spec com seções extras não pode ser aposentada automaticamente.',
        );
      }
      assert(
        !plan.paths.includes(item.path),
        'Sync pós-commit não pode se misturar aos paths de implementação.',
      );
    }
    const activeFiles = files(safe(active)).map((p) =>
      path.relative(cwd, p).split(path.sep).join('/'),
    );
    assert(
      activeFiles.every((p) => plan.paths.includes(p)),
      'Manifesto deve incluir todos os artefatos da mudança.',
    );
    checkIndex(plan.paths);
    run('openspec', ['validate', change, '--strict'], cwd);
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const archive = `openspec/changes/archive/${/^\d{4}-\d{2}-\d{2}-/.test(change) ? change : `${date}-${change}`}`;
    assert(!fs.existsSync(safe(archive)), 'Destino do archive já existe.');
    assert(
      !state ||
        (state.base === initialHead &&
          equal(state.plan, plan) &&
          equal(state.implementationSnapshot, snapshot(plan.paths))),
      'Baseline da retomada foi alterado.',
    );
    const summary = {
      change,
      archive,
      paths: plan.paths,
      sync: plan.sync.map((s) => s.path),
      head: initialHead,
    };
    if (inspect) return { phase: 'inspect', ...summary };
    assert(
      /^\[(feat|make|fix|update|delete)\] \S[^\r\n]*$/.test(
        message ?? state?.message ?? '',
      ),
      'Mensagem de commit inválida.',
    );
    if (!state) {
      state = {
        phase: 'prepared',
        change,
        base: initialHead,
        plan,
        message,
        archive,
        implementationSnapshot: snapshot(plan.paths),
        mainSnapshot: snapshot(plan.sync.map((s) => s.path)),
        sources: Object.fromEntries(
          plan.sync
            .filter((s) => s.source)
            .map((s) => [s.source, fingerprint(safe(s.source))]),
        ),
        activeSnapshot: snapshot(activeFiles),
        activeFiles,
      };
    }
  } else if (inspect) {
    return {
      phase: state.phase,
      change,
      commit: state.commit,
      archive: state.archive,
    };
  }
  fs.mkdirSync(local, { recursive: true });
  assert(
    git('check-ignore', '.openspec-local/probe') === '.openspec-local/probe',
    'Ignore .openspec-local/ antes de concluir.',
  );
  const lock = path.join(local, 'finish.lock');
  let handle;
  try {
    handle = fs.openSync(lock, 'wx');
  } catch {
    throw new Error(
      'Outra conclusão possui o lock. Verifique o processo antes de remover um lock obsoleto.',
    );
  }
  try {
    const stage = (paths) => {
      const tracked = new Set(git('ls-files', '-z').split('\0'));
      const eligible = paths.filter(
        (p) => fs.existsSync(safe(p)) || tracked.has(p),
      );
      for (let i = 0; i < eligible.length; i += 40)
        git('add', '-A', '--', ...eligible.slice(i, i + 40));
      git('diff', '--cached', '--check');
    };
    const ensureUnpublished = () => {
      assert(
        git('rev-parse', 'HEAD') === state.commit,
        'HEAD mudou desde o commit desta execução.',
      );
      // Query the server, not stale tracking refs. No push happens in this program.
      for (const remote of git('remote').split('\n').filter(Boolean)) {
        const refs = git('ls-remote', remote).split('\n').filter(Boolean);
        const oldAncestors = new Set(git('rev-list', state.base).split('\n'));
        for (const ref of refs) {
          const sha = ref.split(/\s+/)[0];
          assert(sha !== state.commit, 'Commit já publicado: amend recusado.');
          if (!oldAncestors.has(sha)) {
            // Fetch only objects/refs; never publish. Refuse if our commit is an ancestor of any server ref.
            git('fetch', '--no-tags', remote, sha);
            const ancestors = git('rev-list', sha).split('\n');
            assert(
              !ancestors.includes(state.commit),
              'Commit alcançável no servidor: amend recusado.',
            );
          }
        }
      }
    };
    if (state.phase === 'prepared') {
      save(state);
      for (const check of ['lint', 'typecheck', 'test', 'build'])
        run('pnpm', [check], cwd, false);
      assert(
        equal(state.implementationSnapshot, snapshot(state.plan.paths)),
        'Checks alteraram arquivos de implementação.',
      );
      assert(
        git('rev-parse', 'HEAD') === state.base,
        'HEAD mudou durante os checks.',
      );
      checkIndex(state.plan.paths);
      stage(state.plan.paths);
      assert(
        changed(true).length > 0,
        'Sem diff novo: nenhum commit vazio será criado.',
      );
      state.commitTree = git('write-tree');
      state.phase = 'committing';
      save(state);
      git('commit', '-m', state.message);
      assert(
        git('rev-parse', 'HEAD^') === state.base &&
          git('rev-parse', 'HEAD^{tree}') === state.commitTree,
        'Commit criado não corresponde ao manifesto revisado.',
      );
      state.commit = git('rev-parse', 'HEAD');
      state.phase = 'committed';
      save(state);
      checkpoint('after-commit');
    }
    if (state.phase === 'committing') {
      const head = git('rev-parse', 'HEAD');
      if (head === state.base) {
        assert(
          git('write-tree') === state.commitTree,
          'Index mudou após tentativa de commit.',
        );
        git('commit', '-m', state.message);
      } else {
        assert(
          git('rev-parse', 'HEAD^') === state.base &&
            git('rev-parse', 'HEAD^{tree}') === state.commitTree &&
            git('log', '-1', '--format=%s') === state.message,
          'Commit interrompido não corresponde ao journal.',
        );
      }
      state.commit = git('rev-parse', 'HEAD');
      state.phase = 'committed';
      save(state);
    }
    if (state.phase === 'amending' && initialHead !== state.commit) {
      assert(
        git('rev-parse', 'HEAD^') === state.base &&
          git('rev-parse', 'HEAD^{tree}') === state.finalTree &&
          git('log', '-1', '--format=%s') === state.message,
        'HEAD mudou fora do amend esperado.',
      );
      assert(
        equal(snapshot(state.finalPaths), state.finalSnapshot),
        'Arquivos mudaram após amend interrompido.',
      );
      state.finalHead = initialHead;
      state.phase = 'done';
      save(state);
      return { phase: 'done', commit: state.finalHead, archive: state.archive };
    }
    ensureUnpublished();
    assert(
      equal(
        Object.fromEntries(
          Object.keys(state.sources).map((p) => [p, fingerprint(safe(p))]),
        ),
        state.sources,
      ),
      'Snapshot revisado foi alterado.',
    );
    if (state.phase === 'committed' || state.phase === 'syncing') {
      checkIndex([]);
      assert(
        equal(snapshot(state.plan.paths), state.implementationSnapshot),
        'Implementação mudou após commit.',
      );
      const desired = Object.fromEntries(
        state.plan.sync.map((s) => [
          s.path,
          s.source === null ? null : fingerprint(safe(s.source)),
        ]),
      );
      for (const item of state.plan.sync) {
        const current = fingerprint(safe(item.path));
        assert(
          current === state.mainSnapshot[item.path] ||
            (state.phase === 'syncing' && current === desired[item.path]),
          'Spec principal mudou fora desta execução.',
        );
      }
      state.phase = 'syncing';
      save(state);
      for (const item of state.plan.sync) {
        if (item.source === null) {
          if (fs.existsSync(safe(item.path))) fs.unlinkSync(safe(item.path));
        } else {
          fs.mkdirSync(path.dirname(safe(item.path)), { recursive: true });
          fs.copyFileSync(safe(item.source), safe(item.path));
        }
      }
      assert(
        equal(snapshot(state.plan.sync.map((s) => s.path)), desired),
        'Sync difere do snapshot revisado.',
      );
      run('openspec', ['validate', '--specs', '--strict'], cwd);
      state.syncedSnapshot = desired;
      state.phase = 'synced';
      save(state);
      checkpoint('after-sync');
    }
    if (state.phase === 'synced' || state.phase === 'archiving') {
      checkIndex([]);
      assert(
        equal(
          snapshot(state.plan.sync.map((s) => s.path)),
          state.syncedSnapshot,
        ),
        'Specs sincronizadas foram alteradas.',
      );
      const exists = fs.existsSync(safe(active));
      if (exists) {
        assert(
          equal(snapshot(state.activeFiles), state.activeSnapshot),
          'Artefatos ativos mudaram.',
        );
        assert(
          !fs.existsSync(safe(state.archive)),
          'Destino incompatível já existe.',
        );
        state.phase = 'archiving';
        save(state);
        // Sync has already been reviewed, copied and validated. Avoid applying the delta twice.
        run(
          'openspec',
          ['archive', change, '--yes', '--skip-specs', '--json'],
          cwd,
        );
      }
      assert(
        !fs.existsSync(safe(active)) && fs.existsSync(safe(state.archive)),
        'Archive não foi concluído no destino esperado.',
      );
      const archivedFiles = state.activeFiles.map((p) =>
        p.replace(active + '/', state.archive + '/'),
      );
      assert(
        equal(
          files(safe(state.archive))
            .map((p) => path.relative(cwd, p).split(path.sep).join('/'))
            .sort(),
          [...archivedFiles].sort(),
        ),
        'Archive contém arquivos inesperados.',
      );
      assert(
        equal(
          Object.values(snapshot(archivedFiles)),
          Object.values(state.activeSnapshot),
        ),
        'Archive não preservou os artefatos.',
      );
      state.finalPaths = [
        ...new Set([
          ...state.plan.paths,
          ...archivedFiles,
          ...state.plan.sync.map((s) => s.path),
        ]),
      ];
      state.finalSnapshot = snapshot(state.finalPaths);
      state.phase = 'archived';
      save(state);
      checkpoint('after-archive');
    }
    if (state.phase === 'archived') {
      checkIndex(state.finalPaths);
      assert(
        equal(snapshot(state.finalPaths), state.finalSnapshot),
        'Arquivos mudaram antes do amend.',
      );
      stage(state.finalPaths);
      state.finalTree = git('write-tree');
      state.phase = 'amending';
      save(state);
      checkpoint('before-amend');
    }
    if (state.phase === 'amending') {
      ensureUnpublished();
      assert(
        equal(snapshot(state.finalPaths), state.finalSnapshot),
        'Arquivos mudaram antes da retomada do amend.',
      );
      checkIndex(state.finalPaths);
      assert(
        git('write-tree') === state.finalTree,
        'Index mudou antes do amend.',
      );
      git('diff', '--cached', '--check');
      git('commit', '--amend', '--no-edit');
      state.finalHead = git('rev-parse', 'HEAD');
      assert(
        git('rev-parse', 'HEAD^{tree}') === state.finalTree,
        'Hooks alteraram a árvore final.',
      );
      assert(
        equal(snapshot(state.finalPaths), state.finalSnapshot),
        'Arquivos alterados durante amend.',
      );
      assert(
        changed().every((p) => !state.finalPaths.includes(p)),
        'Paths próprios continuam pendentes.',
      );
      assert(
        git('rev-parse', 'HEAD^') === state.base,
        'Conclusão criou mais de um commit.',
      );
      state.phase = 'done';
      save(state);
    }
    return {
      phase: state.phase,
      commit: state.finalHead,
      archive: state.archive,
      files: state.finalPaths,
    };
  } finally {
    fs.closeSync(handle);
    fs.unlinkSync(lock);
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const argv = process.argv.slice(2).filter((a) => a !== '--');
    const options = {};
    for (let i = 0; i < argv.length; i++) {
      const key = argv[i];
      assert(
        ['--change', '--manifest', '--message', '--inspect'].includes(key),
        `Opção desconhecida: ${key}`,
      );
      options[key.slice(2)] = key === '--inspect' ? true : argv[++i];
    }
    console.log(JSON.stringify(finish(options), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
