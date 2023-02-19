export interface Source {
    id: string
    type: string
    origin: string;
    ids: string[];
}

export interface Notebook {
    name: string;
    sources: Source[];
    live_sources: Source[];
    content: any
}