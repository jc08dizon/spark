# Pattern: Layered Feature

Use this pattern whenever a feature needs server-side behavior or database access.

## File Layout

```text
src/app/api/<feature>/route.ts
src/server/services/<feature>Service.ts
src/server/validators/<feature>Validator.ts
src/server/repositories/<feature>Repository.ts
```

Add UI pages under `src/app/<feature>/page.tsx` and compose them from `src/components/ui/`.

## Route Handler

Route handlers authenticate and call services. They do not query Prisma.

```ts
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { isAppInputError } from "@/server/errors";
import { featureService } from "@/server/services/featureService";

export const POST = withAuth(async (request) => {
  try {
    const result = await featureService.create(await request.json());
    return NextResponse.json({ result }, { status: 201 });
  } catch (error) {
    if (isAppInputError(error)) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
});
```

## Service

Services hold business rules and call repositories.

```ts
import { featureRepository } from "@/server/repositories/featureRepository";
import { parseCreateFeatureInput } from "@/server/validators/featureValidator";

export async function createFeature(input: unknown) {
  const validInput = parseCreateFeatureInput(input);
  const record = await featureRepository.create(validInput);
  return {
    id: record.id,
    title: record.title,
    createdAt: record.createdAt.toISOString(),
  };
}
```

## Repository

Repositories are the only feature files that import `db`.

```ts
import { db } from "@/lib/db";

export async function createFeatureRecord(input: { title: string }) {
  return db.exampleItem.create({
    data: { title: input.title },
    select: { id: true, title: true, createdAt: true },
  });
}
```

## Validator

Validators parse unknown input and throw `AppInputError` for user-fixable problems.

```ts
import { AppInputError } from "@/server/errors";

export function parseTitle(input: unknown): string {
  if (typeof input !== "string" || input.trim().length < 3) {
    throw new AppInputError("Title must be at least 3 characters.");
  }
  return input.trim();
}
```
