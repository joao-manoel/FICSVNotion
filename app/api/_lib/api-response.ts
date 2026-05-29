import { NextResponse } from "next/server";
import { SettingsSchema, type Settings } from "../../../backend/schemas/settings.schema";

type Handler<T> = () => Promise<T> | T;

export async function apiResult<T>(handler: Handler<T>) {
  try {
    return NextResponse.json({
      ok: true,
      data: await handler(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Ocorreu um erro inesperado.",
      },
      { status: 400 },
    );
  }
}

export function parseSettings(input: unknown): Settings {
  return SettingsSchema.parse(input);
}
