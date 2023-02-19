export interface Source {
    id: string
    type: string
    origin: string;
    ids: string[];
}

export interface Message {
    sender: string;
    text: string;
}

export interface Notebook {
    name: string;
    sources: Source[];
    live_sources: Source[];
    conversation: Message[];
    content: any
}

export interface INotebookContext {
    id: string;
    notebook: Notebook;
    rename: (name: string) => Promise<void>;
    startLiveSource: (origin: string) => Promise<void>;
    stopLiveSource: (origin: string) => Promise<void>;
    run: (prompt: string) => Promise<void>;
    generate: (prompt: string) => Promise<void>;
    chat: (prompt: string) => Promise<string>;
    edit: (text: string, prompt: string) => Promise<void>;
    ideas: () => Promise<void>;
    addPdf: (origin: string) => Promise<void>;
    addYoutube: (origin: string) => Promise<void>;
    addWeb: (origin: string) => Promise<void>;
    sourceSummary: (sourceId: string) => Promise<void>;
    liveSourceSummary: (sourceId: string) => Promise<void>;
    save: () => Promise<void>;
}