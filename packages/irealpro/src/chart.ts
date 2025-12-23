import { type Cell, type TuneMetadata, type Chord, NO_ROOT } from "./types.js";

const TRANSPOSE_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const TRANSPOSE_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/** Computes a table that maps every note to its transposed counterpart. */
const getTranspositionTable = (semitones: number) => {
    const table: Record<string, string> = {};
    const transpose = semitones < 0 ? TRANSPOSE_FLAT : TRANSPOSE_SHARP;
    for (let i = 0; i < 12; i++) {
        table[TRANSPOSE_FLAT[i]!] = transpose[(i + semitones) % 12]!;
        table[TRANSPOSE_SHARP[i]!] = transpose[(i + semitones) % 12]!;
    }
    return table;
};

export class ChordChart {
    cells: Cell[];
    currentKey: string;
    metadata: TuneMetadata;

    constructor(cells: Cell[], metadata: TuneMetadata) {
        this.cells = cells;
        this.metadata = metadata;
        this.currentKey = metadata.key;
    }

    /**
     * Transposes the chord chart by the given number of semitones.
     * @param semitones Number of semitones to transpose by. Positive for up, negative for down.
     */
    transpose(semitones: number) {
        const transpositionTable = getTranspositionTable(semitones);
        this.cells = this.cells.map((cell) => {
            if (typeof cell.content == "object") {
                cell.content = this.transposeChord(cell.content, transpositionTable);
            }
            if (cell.alternateChord) {
                cell.alternateChord = this.transposeChord(cell.alternateChord, transpositionTable);
            }
            return cell;
        });
    }

    private transposeChord(chord: Chord, table: Record<string, string>): Chord {
        if (chord.note !== NO_ROOT) {
            chord.note = table[chord.note]!;
        }
        if (chord.over) {
            chord.over = table[chord.over]!;
        }
        return chord;
    }
}
