export interface SourceDTO {
    id: string;
    name: string;
    shortName: string;
    key: "C" | "Bb" | "Eb" | "Bass";
    publisher: string | undefined;
    publishDate: string | undefined;
}

export interface TuneVersionDTO {
    id: string;
    source: SourceDTO;
}

export interface TunePreviewDTO {
    id: string;
    title: string;
    artist: string | undefined;
    key: string | undefined;
    timeSignature: string | undefined;
    tags: string[];
    numVersions: number;
}

export interface TuneDTO extends TunePreviewDTO {
    versions: TuneVersionDTO[];
    changes: string | undefined;
}
