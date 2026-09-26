 # Jev Engine

A JavaScript decision-support engine built on top of the System One "Jev" model. This repository contains the core library under `core/` and example/demo projects under `examples/`.

**Quick goals:** provide a type-safe, minimal API surface for building decision graphs using the System One "Jev" model as the main driver. The library provides a set of core graph building blocks, full state tracking through listeners and results, and a set of built-in rendering options for viewing the generated graph.

**Important files:**
- **Core package:** [core/package.json](core/package.json)
- **Examples package:** [examples/package.json](examples/package.json)
- **Support-ticket demo:** [examples/support_ticket_analyzer/index.ts](examples/support_ticket_analyzer/index.ts)

**Prerequisites:**
- **Node.js:** 18.x or later (LTS recommended).
- **npm** (or an npm-compatible client such as `pnpm` or `yarn`).
- Optional: `npx`/`tsx` for running TypeScript examples without a build step.

**Setup (local development)**

1. Install dependencies for the core library:

```bash
cd core
npm install
```

2. Install dependencies for the examples:

```bash
cd ../examples
npm install
```

Note: the examples depend on the local `core` package via a file reference in [examples/package.json](examples/package.json). Installing in `examples/` will ensure the local link is used.

**Type checking / build**

- Run the TypeScript typecheck for the core library:

```bash
cd core
npm run typecheck
```

The project is distributed as TypeScript sources. There is no separate transpile build step in this repo; use `tsx`/`ts-node` or compile with `tsc` if you need output JS files.

**Running the demos**

- Core example (customer workflow):

```bash
cd core
npm run example:customer
```

- Support-ticket analyzer (example that renders a Mermaid file):

From the `examples/` folder:

```powershell
#$env:MODEL='gpt-4o-mini'; npm run example:support-ticket
```

Or on Unix/macOS shells:

```bash
MODEL=gpt-4o-mini npm run example:support-ticket
```

The support-ticket example will generate a `graph.mmd` file in the current folder by rendering the graph with the built-in `MermaidRenderer`.

- Chess demo (quick run):

You can run the chess example directly with `tsx` from the repository root:

```bash
npx tsx examples/chess/index.ts
```

- Chess server (AI-vs-AI simulation):

```powershell
cd examples
$env:MODEL='your-model'; $env:OPENROUTER_API_KEY='your-key'; npm run example:chess-server
```

Open `http://localhost:3000`. Set `WHITE_MODEL` and `BLACK_MODEL` to use
different models for each side; otherwise both use `MODEL`. Set `PORT` to use a
different local port. The browser's delay input controls the pause between
animated AI moves.




