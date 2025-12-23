export const AnnotationTokens = {
    Comment: "comment",
    Section: "section",
    TimeSignature: "timeSignature",
    RepeatMarker: "repeatMarker",
    VerticalSpacer: "Y",
    Fine: "U",
    Fermata: "f",
    Coda: "Q",
    Segno: "S",
} as const;
export type AnnotationTokenType = keyof typeof AnnotationTokens;

export const BarlineTokens = {
    StartRepeat: "{",
    EndRepeat: "}",
    BarLeft: "|",
    DoubleBarLeft: "[",
    DoubleBarRight: "]",
    EndBarRight: "Z",
} as const;
export type BarlineTokenType = keyof typeof BarlineTokens;

export const CellContent = {
    Chord: "chord",
    Space: " ",
    NoRoot: "W",
    Pause: "p",
    BarRepeat: "x",
    DoubleBarRepeat: "r",
} as const;
export type CellContentType = keyof typeof CellContent;

export const TOKENS = {
    ...CellContent,
    ...AnnotationTokens,
    ...BarlineTokens,

    AlternateChord: "alternateChord",
    SmallNotes: "s",
    NormalNotes: "l",
} as const;

export type TokenType = keyof typeof TOKENS;

export type Token = {
    type: TokenType;
    value: string;
};

export type Annotation = {
    type: AnnotationTokenType;
    /** Value exists for sections, repeat markers and comments. */
    value: string | undefined;
};

export const NO_ROOT = "W";
export type Chord = {
    /** (Root) note of the chord, e.g. "F", "Eb" or "G#". "W" for no root." */
    note: string;
    modifiers: string;
    over: string | null;
    small: boolean;
};

export type Cell = {
    annotations?: Annotation[];
    barline?: BarlineTokenType;
    /** Whether the cell is marked as having vertical space above its row. */
    verticalSpacer?: boolean;
    /** The content for this cell. */
    content: Chord | CellContentType;
    /** Alternate chord above the cell. */
    alternateChord?: Chord;
};

export type TuneMetadata = {
    title: string;
    composer: string;
    style: string;
    key: string;
    rawMusic: string;
};
