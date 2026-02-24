# Frontend Design

## State Management: Signals + RxJS (No NgRx)

We use Angular's built-in **Signals** for state and **RxJS** for async streams. No external state management library (NgRx, NgXS, etc.) is used.

### Why not NgRx?

NgRx introduces actions, reducers, effects, and selectors — a multi-layered architecture designed for applications where complex, shared state flows between many components. This project doesn't have that need. State is mostly component-local: a workspace list, a form's loading flag, whether a dialog is open.

Adding NgRx here would mean significant boilerplate for simple operations that a signal handles in one line.

### How Signals and RxJS complement each other

- **Signals** — Local component state and computed values. Define with `signal()`, update with `.set()` / `.update()`, derive with `computed()`. No subscriptions, no cleanup, no boilerplate.
- **RxJS** — HTTP calls and stream-based orchestration (debounce, switchMap, retry). Angular's `HttpClient` returns observables natively — fighting this with signals would add unnecessary complexity.

```typescript
// Signals for state
protected workspaces = signal<Workspace[]>([]);
protected loading = signal(true);

// RxJS for HTTP streams
this.workspaceApi.list().subscribe({
  next: (res) => {
    this.workspaces.set(res.data);
    this.loading.set(false);
  },
});
```

### Future scaling

If a piece of state needs to be shared across multiple components (e.g., the currently active workspace), a signal-based service with `providedIn: 'root'` handles this without introducing NgRx:

```typescript
@Injectable({ providedIn: 'root' })
export class ActiveWorkspaceService {
  private _workspace = signal<Workspace | null>(null);
  readonly workspace = this._workspace.asReadonly();

  select(ws: Workspace) { this._workspace.set(ws); }
}
```

## Project Structure: core / shared / features

The frontend is organized into three top-level directories, each with a distinct role:

```
apps/web/src/app/
├── core/       → Application infrastructure (singletons, required to run)
├── shared/     → Reusable, independent building blocks
├── features/   → Business logic (lazy-loaded)
```

### `core/` — Application infrastructure

Singleton services, layout, interceptors, and constants that the application **cannot run without**. There is exactly one instance of each.

- `layout.ts` — Root page shell (sidebar + navbar + router-outlet)
- `auth-api.ts` — Authentication HTTP calls
- `credentials.ts` — Interceptor that adds `withCredentials: true` to every request
- `sidebar.ts` — Sidebar collapse/expand state
- `constants/` — Route paths, validation rules

If something in `core/` is removed, the application breaks.

### `shared/` — Reusable UI components

Components, directives, and pipes that are **independent of any feature** and can be used anywhere:

- `button.ts`, `input.ts`, `dialog.ts`, `data-table.ts` — Generic UI components
- `icons/` — SVG icon components

A shared component never imports from `core/` or `features/`. It has no knowledge of business logic.

### `features/` — Business modules

Each feature is a self-contained, lazy-loaded module representing a user-facing area of the application:

- `auth/` — Login, register
- `dashboard/` — Main dashboard
- `workspaces/` — Workspace listing and management

Features import from `core/` (services) and `shared/` (UI components), but never from other features.
