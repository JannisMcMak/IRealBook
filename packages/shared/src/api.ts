import type { TuneDTO, TunePreviewDTO } from "./dto.js";

export interface ApiRoutes {
    basePath: "/api";

    Login: {
        path: "/login";
        body: { password: string };
        response: { token: string };
    };
    Authorize: {
        path: "/authorize";
        response: { token: string };
    };

    Search: {
        path: "/search";
        urlParams: {
            query: string;
        };
        response: TunePreviewDTO[];
    };
    Random: {
        path: "/random";
        response: TuneDTO;
    };
    GetTune: {
        path: "/tune/:id";
        pathParams: {
            id: string;
        };
        response: TuneDTO;
    };
    GetFile: {
        path: "/tune/:tuneID/:versionID/file";
        pathParams: {
            tuneID: string;
            versionID: string;
        };
    };
}
