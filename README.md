# nsm-web

## Deployment

### Web

```shell
pnpm install
pnpm --filter web run build --mode=testing --base=https://cdn.ns.top/dev/web # build for testing (.env.testing applied)
pnpm --filter web run build --mode=staging --base=https://cdn.ns.top/beta/web # build for staging (.env.staging applied)
pnpm --filter web run build --mode=production --base=https://cdn.ns.top/web # build for production (.env.production applied)
# then deploy all the files in the `packages/web/dist` directory
```

### Component Library

```shell
pnpm install
pnpm --filter component run build
# then deploy all the files in the `packages/component/storybook-static` directory
```
