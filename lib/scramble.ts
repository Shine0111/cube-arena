export async function generateScramble(event: string = "333"): Promise<string> {
  const moduleUrl = "https://cdn.cubing.net/v0/js/cubing/scramble";

  const { randomScrambleForEvent } = await import(
    /* webpackIgnore: true */ moduleUrl
  );

  const scramble = await randomScrambleForEvent(event);

  return scramble.toString();
}
