import { ChordChart } from "./chart.js";
import parseIRealProChords from "./parser.js";
import type { TuneMetadata } from "./types.js";
import { unscramble } from "./unscramble.js";
export * from "./types.js";

const musicPrefix = "1r34LbKcu7";

export function generateChordChart(tune: TuneMetadata): ChordChart {
    return new ChordChart(parseIRealProChords(tune.rawMusic!), tune);
}

export function parseIRealProTune(raw: string): TuneMetadata {
    // Metadata is separated by = (sometimes empty)
    const parts = raw.split(/=+/).filter((x) => x != "");
    let title: string | undefined = "";
    let composer: string | undefined = "";
    let style: string | undefined = "";
    let key: string | undefined = "";
    let rawMusic: string | undefined = "";
    let compStyle: string | undefined = "";
    let transpose: string | undefined = "";

    if (parts.length === 7) {
        [title, composer, style, key, rawMusic] = parts;
    }
    if (parts.length === 8 && parts[4]!.startsWith(musicPrefix)) {
        [title, composer, style, key, rawMusic, compStyle] = parts;
    }
    if (parts.length === 8 && parts[5]!.startsWith(musicPrefix)) {
        [title, composer, style, key, transpose, rawMusic] = parts;
    }
    if (parts.length === 9) {
        [title, composer, style, key, transpose, rawMusic, compStyle] = parts;
    }

    // Prepare music
    if (rawMusic) {
        const scrambled = rawMusic.split(musicPrefix).at(1);
        if (!scrambled) {
            throw new Error("Invalid tune");
        }
        rawMusic = unscramble(scrambled);
    }

    return {
        title: title ?? "",
        composer: composer ?? "",
        style: style ?? "",
        key: key ?? "",
        rawMusic: rawMusic ?? "",
    };
}

export function parseIRealProPlaylist(raw: string): TuneMetadata[] {
    // Tunes are separated by "==="
    return raw.split("===").slice().map(parseIRealProTune);
}
