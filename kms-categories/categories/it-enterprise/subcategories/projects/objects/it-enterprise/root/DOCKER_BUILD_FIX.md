# 🔧 Docker Build Fix - Workspace Dependencies

## Problém

Docker build selhával, protože workspace závislosti (`@it-enterprise/*`) nejsou dostupné v Docker kontejneru.

## ✅ Řešení

Upravil jsem Dockerfiles, aby kopírovaly:
1. Root `package.json` a `package-lock.json` pro workspace support
2. Všechny `packages/` pro workspace dependencies
3. Pak instalovaly závislosti

## Alternativní řešení

Můžeme také:
1. Buildovat aplikace lokálně a pak kopírovat build do Dockeru
2. Použít multi-stage build s celým monorepo kontextem
3. Publikovat packages do npm registry (pro produkci)

## Aktuální stav

✅ Dockerfiles upraveny pro workspace support
🔄 Testování buildu

## Pro produkci

Doporučuji:
- Buildovat aplikace lokálně: `npm run build`
- Použít production Dockerfiles, které kopírují pouze build artifacts
- Nebo publikovat workspace packages do privátního npm registry

