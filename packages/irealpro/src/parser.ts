import {
    type Token,
    type Cell,
    type Chord,
    type TokenType,
    type Annotation,
    TOKENS,
    type AnnotationTokenType,
} from "./types.js";

/**
 * The RegExp for a complete chord. The match array contains:
 * 1 - the base note
 * 2 - the modifiers (+-ohd0123456789 and su for sus)
 * 3 - any comments (may be e.g. add, sub, or private stuff)
 * 4 - the "over" part starting with a slash
 */
const CHORD_REGEX = /^([A-GWn][b#]?)((?:sus|alt|add|[\+\-\^\dhob#])*)(\*.+?\*)*(\/[A-G][#b]?)?/;

const TOKEN_REGEX: Partial<Record<TokenType, RegExp>> = {
    Section: /^\*[a-zA-Z]/,
    TimeSignature: /^T\d\d/,
    RepeatMarker: /^N./,
    Comment: /^<.*?>/,
    Chord: CHORD_REGEX,
    AlternateChord: /^(\(.*?\))/,
};

export default function parseIRealProChords(raw: string): Cell[] {
    const tokens = tokenize(raw);
    return parse(tokens);
}

/**
 * Split the raw music string into a list of tokens.
 */
function tokenize(text: string): Token[] {
    const tokens: Token[] = [];
    text = text.trim().replaceAll(",", "");
    while (text) {
        let found = false;
        for (const [tokenTypeName, tokenTypeValue] of Object.entries(TOKENS)) {
            const tokenType = tokenTypeName as TokenType;

            if (tokenType in TOKEN_REGEX) {
                // This token types needs to be parsed with regex.
                const res = TOKEN_REGEX[tokenType]!.exec(text);
                if (res && res.length > 0) {
                    found = true;
                    if (res.length === 1) {
                        // The match is a single token
                        const token = res[0];
                        tokens.push({ type: tokenType, value: token });
                        text = text.substring(token.length);
                    } else {
                        // The match is a chord.
                        // res[0] contains the full chord.
                        // The other entries are modifiers, extensions, etc.
                        tokens.push({ type: tokenType, value: res.join(",") });
                        text = text.substring(res[0].length);
                    }
                    break;
                }
            } else {
                // Token can be matched with simple string comparison
                if (text.startsWith(tokenTypeValue)) {
                    found = true;
                    tokens.push({ type: tokenType, value: tokenTypeValue });
                    text = text.substring(tokenTypeValue.length);
                    break;
                }
            }
        }
        if (!found) {
            console.warn(`Unknown token: "${text[0]}"`);
            console.log(text);
            text = text.substring(1);
        }
    }
    return tokens;
}

function parse(tokens: Token[]): Cell[] {
    const cells: Cell[] = [];
    /** The cell that is currently being parsed. */
    let cell: Cell = { content: "Space" };
    let smallNotes = false;

    /** Shorthand for finishing the current cell and opening a new one. */
    const finishCell = () => {
        cells.push(cell);
        cell = { content: "Space" };
    };

    while (tokens.length) {
        const token = tokens.shift()!;

        // Lookahead for right barlines
        if (tokens.length) {
            const nextToken = tokens[0]!;
            if (
                nextToken.type === "DoubleBarRight" ||
                nextToken.type === "EndBarRight" ||
                nextToken.type === "EndRepeat"
            ) {
                cell.barline = nextToken.type;
                tokens.shift();
            }
        }

        // Parse token by type
        switch (token.type) {
            case "SmallNotes":
                smallNotes = true;
                break;
            case "NormalNotes":
                smallNotes = false;
                break;
            case "VerticalSpacer":
                cell.verticalSpacer = true;
                break;

            // Annotations
            case "Comment":
            case "Section":
            case "TimeSignature":
            case "RepeatMarker":
            case "Segno":
            case "Coda":
            case "Fermata":
            case "Fine":
                if (!cell.annotations) cell.annotations = [];
                cell.annotations.push(parseAnnotation(token));
                break;

            // Cell content
            case "Chord":
                cell.content = parseChord(token.value.split(","));
                cell.content!.small = smallNotes;
                finishCell();
                break;
            case "Space":
            case "Pause":
            case "BarRepeat":
            case "DoubleBarRepeat":
                cell.content = token.type;
                finishCell();
                break;

            case "AlternateChord":
                const match = CHORD_REGEX.exec(token.value);
                if (match) cell.alternateChord = parseChord(match.slice(1));
                break;

            // Barlines
            case "StartRepeat":
            case "EndRepeat":
            case "BarLeft":
            case "DoubleBarLeft":
            case "DoubleBarRight":
            case "EndBarRight":
                cell.barline = token.type;
                break;
        }
    }

    return cells;
}

/**
 * Parse raw IReal Pro chord into a Chord object.
 * @param parts List of chord parts from executing {@link CHORD_REGEX}.
 * The first element should be the whole chord.
 * @returns Parsed chord object.
 */
function parseChord(parts: string[]): Chord {
    let note = parts.at(1) || " ";
    let modifiers = parts.at(2) || "";

    let comment = parts.at(3) || "";
    if (comment) modifiers += comment.substring(1, comment.length - 2);

    let overRaw = parts.at(4) || "";
    let over: string | null = null;
    if (overRaw[0] === "/") overRaw = overRaw.substring(1);
    if (overRaw) {
        const offset = overRaw[1] === "#" || overRaw[1] === "b" ? 2 : 1;
        over = overRaw.substring(0, offset);
    }

    return {
        note,
        modifiers,
        over,
        small: false,
    };
}

function parseAnnotation(token: Token): Annotation {
    let value: string | undefined = undefined;

    if (token.type === "Comment") {
        // Comments are enclosed in < >
        value = token.value.substring(1, token.value.length - 1);
        // Comments can have a 2-digit number (following "*") indicating vertical position (we ignore this)
        if (value.startsWith("*")) value = value.substring(3);
    } else if (token.type === "Section") {
        value = token.value.replace("*", "");
        if (value === "i") value = "in";
    } else {
        value = undefined;
    }

    return {
        type: token.type as AnnotationTokenType,
        value,
    };
}
