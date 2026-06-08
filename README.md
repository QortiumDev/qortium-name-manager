# Qortium Name Manager

A name marketplace Q-App for the Qortium ecosystem. Register new names, manage names you own, list them for sale, and browse or purchase names listed by others.

Built to be forked — see [Naming](#naming) below.

## Build

```
npm install
npm run build
```

Output is a single HTML file at `dist/index.html`, ready to publish as a Qortium APP.

## Naming

The name this app publishes under is set in `src/apps.ts`:

```ts
names: { qdn: 'Names', label: 'Names' },
```

Change `qdn` to whatever name you've registered on your network, then publish under that name. Update the same registry entry in any other apps that link to this one.
