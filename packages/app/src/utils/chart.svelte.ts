import { type Cell, type Chord, NO_ROOT, parseIRealProChords } from '@irealbook/irealpro';
import type { TuneDTO } from '@irealbook/shared';

const TRANSPOSE_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const TRANSPOSE_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export class ChordChart {
	cells: Cell[] = $state([]);
	originalKey: string;
	/** Number of semitones to transpose relative to the original key. */
	private transposition: number = $state(0);

	constructor(tune: TuneDTO) {
		if (!tune.changes || !tune.key) {
			this.cells = [];
			this.originalKey = '';
			return;
		}
		this.cells = parseIRealProChords(tune.changes);
		this.originalKey = tune.key.replace('min', '');
	}

	get currentKey(): string {
		return this.transposeNote(this.originalKey);
	}

	private transpose(newTransposition: number) {
		this.transposition = newTransposition;
		this.cells = this.cells.map((cell) => {
			if (typeof cell.content == 'object') {
				cell.content = this.transposeChord(cell.content);
			}
			if (cell.alternateChord) {
				cell.alternateChord = this.transposeChord(cell.alternateChord);
			}
			return cell;
		});
	}

	transposeUp() {
		this.transpose(this.transposition + 1);
	}
	transposeDown() {
		this.transpose(this.transposition - 1);
	}
	resetTransposition() {
		this.transpose(0);
	}

	private transposeChord(chord: Chord): Chord {
		if (chord.note !== NO_ROOT) {
			chord.note = this.transposeNote(chord.note);
		}
		if (chord.over) {
			chord.over = this.transposeNote(chord.over);
		}
		return chord;
	}
	private transposeNote(note: string): string {
		if (!this.transposition) return note;
		const table = TRANSPOSE_FLAT;
		const index = table.indexOf(note);
		const newIndex = (((index + this.transposition) % table.length) + table.length) % table.length;
		return table[newIndex];
	}

	/** Table that maps every note to its transposed counterpart. */
	private get transpositionTable(): Record<string, string> {
		const table: Record<string, string> = {};
		const transpose = this.transposition < 0 ? TRANSPOSE_FLAT : TRANSPOSE_SHARP;
		for (let i = 0; i < 12; i++) {
			table[TRANSPOSE_FLAT[i]!] = transpose[(i + this.transposition) % 12]!;
			table[TRANSPOSE_SHARP[i]!] = transpose[(i + this.transposition) % 12]!;
		}
		return table;
	}
}
