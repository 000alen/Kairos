export type XYT = [number, number, string];

export interface Source {
    id: string
    type: string
    origin: string;
    ids: string[];
}

export interface Message {
    id: string;
    sender: string;
    text: string;
}

export interface Action {
    tool: string;
    tool_input: string;
    log: string;
}

export interface Step {
    action: Action;
    result: string;
}

export interface Generation {
    id: string;
    type: string;
    input: string;
    output: string;
    intermediate_steps: Step[];
}

export interface Notebook {
    name: string;
    sources: Source[];
    live_sources: Source[];
    conversation: Message[];
    content: any
    generations: Generation[]
}

export interface Job<T = any> {
    id: string;
    status: string;
    error: boolean;
    output?: T;
}

export interface INotebookContext {
    id: string;
    name: string;
    sources: Source[];
    liveSources: Source[];
    runningLiveSources: string[];
    conversation: Message[];
    generations: Generation[];
    jobs: Job[];
    popupShown: boolean;
    setPopupShown: (shown: boolean) => void;
    popupTitle: string | null;
    popupDescription: string | null;
    rename: (name: string) => Promise<void>;
    startLiveSource: (origin: string) => Promise<void>;
    stopLiveSource: (origin: string) => Promise<void>;
    run: (prompt: string) => Promise<void>;
    generate: (prompt: string) => Promise<void>;
    chat: (prompt: string) => Promise<string | void>;
    edit: (text: string, prompt: string) => Promise<void>;
    ideas: () => Promise<void>;
    addSource: (type: string, origin: string) => Promise<void>;
    sourceSummary: (sourceId: string) => Promise<void>;
    liveSourceSummary: (sourceId: string) => Promise<void>;
    save: () => Promise<void>;
    insert: (text: string) => Promise<void>;
    insertAt: (text: string, from: number, to: number) => Promise<void>;
}