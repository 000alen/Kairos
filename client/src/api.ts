import { buildUrl } from "build-url-ts"
import { Job } from "./typings";

const API_URL = 'http://127.0.0.1:5000';

export const openFile = async (notebookId: string, type?: string) => {
    const url = buildUrl(API_URL, {
        path: 'files/open',
        queryParams: {
            notebook_id: notebookId,
            type
        }
    });

    const response = await fetch(url);
    const path = await response.json();

    return path;
}

export const saveFile = async (notebookId: string, type?: string) => {
    const url = buildUrl(API_URL, {
        path: 'files/save',
        queryParams: {
            notebook_id: notebookId,
            type
        }
    });

    const response = await fetch(url);
    const path = await response.json();

    return path;
}


export const createNotebook = async (name?: string, path?: string): Promise<string> => {
    const url = buildUrl(API_URL, {
        path: 'notebooks/create',
        queryParams: {
            name,
            path
        }
    });

    const response = await fetch(url);
    const id = await response.json();

    return id;
}

export const renameNotebook = async (notebookId: string, name: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/rename`,
        queryParams: {
            name
        }
    });

    const response = await fetch(url);
    const notebook = await response.json();

    return notebook;
}

export const getNotebook = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}`,
    });

    const response = await fetch(url);
    const notebook = await response.json();

    return notebook;
}

export const saveNotebook = async (notebookId: string, content: object, path?: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/save`,
        queryParams: {
            path
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const loadNotebook = async (path?: string) => {
    const url = buildUrl(API_URL, {
        path: 'notebooks/load',
        queryParams: {
            path
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const notebookRun = async (notebookId: string, content: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/run`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookGenerate = async (notebookId: string, content: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/generate`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookEdit = async (notebookId: string, content: string, text: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/edit`,
        queryParams: {
            text,
            prompt
        }
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const notebookChat = async (notebookId: string, prompt: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/chat`,
        queryParams: {
            prompt
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const getIdeas = async (notebookId: string, content: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/ideas`,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(content),
    });
    const jobId = await response.json();

    return jobId;
}

export const addSource = async (notebookId: string, type: string, origin: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/add`,
        queryParams: {
            type,
            origin
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const getSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/${sourceId}`,
    });

    const response = await fetch(url);
    const source = await response.json();

    return source;
}

export const getSourceContent = async (notebookId: string, sourceId: string, lastK?: number) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/${sourceId}/content`,
        queryParams: {
            last_K: lastK
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const getSourceSummary = async (notebookId: string, sourceId: string, lastK?: number) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources/${sourceId}/summary`,
        queryParams: {
            last_K: lastK
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const startLiveSource = async (notebookId: string, type: string, origin: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/start`,
        queryParams: {
            type,
            origin
        }
    });

    const response = await fetch(url);
    const status = await response.json();

    return status;
}

export const getRunningLiveSources = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/running`,
    });

    const response = await fetch(url);
    const sources = await response.json();

    return sources;
}

export const getLiveSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}`,
    });

    const response = await fetch(url);
    const source = await response.json();

    return source;
}

export const getLiveSourceSummary = async (notebookId: string, sourceId: string, lastK?: number) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}/summary`,
        queryParams: {
            last_K: lastK
        }
    });

    const response = await fetch(url);
    const jobId = await response.json();

    return jobId;
}

export const stopLiveSource = async (notebookId: string, sourceId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources/${sourceId}/stop`,
    });

    const response = await fetch(url);
    const status = await response.json();

    return status;
}

export const getDocument = async (notebookId: string, documentId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/documents/${documentId}`,
    });

    const response = await fetch(url);
    const document = await response.json();

    return document;
}

export const getJobs = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/jobs`,
    });

    const response = await fetch(url);
    const jobs = await response.json();

    return jobs;
}

export const getJob = async (notebookId: string, jobId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/jobs/${jobId}`,
    });

    const response = await fetch(url);
    const job = await response.json();

    return job;
}


const sleep = (time: number) => new Promise(resolve => setTimeout(resolve, time));


export const joinJob = async <T,>(
    notebookId: string,
    jobId: string,
    onProgressCallback: Function,
    timeout: number = 250
): Promise<Job<T>> => {
    let job = await getJob(notebookId, jobId);

    while (job.status === 'running') {
        onProgressCallback(job);
        await sleep(timeout);
        job = await getJob(notebookId, jobId);
    }

    return job;
}

export const getEvents = (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `events/${notebookId}`,
    });

    return new EventSource(url);
}

export const getSources = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/sources`,
    });

    const response = await fetch(url);
    const sources = await response.json();

    return sources;
}

export const getLiveSources = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/live_sources`,
    });

    const response = await fetch(url);
    const sources = await response.json();

    return sources;
}

export const getConversation = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/conversation`,
    });

    const response = await fetch(url);
    const conversation = await response.json();

    return conversation;
}

export const getGenerations = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/generations`,
    });

    const response = await fetch(url);
    const generations = await response.json();

    return generations;
}

export const getName = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/name`,
    });

    const response = await fetch(url);
    const name = await response.json();

    return name;
}

export const getContent = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/content`,
    });

    const response = await fetch(url);
    const content = await response.json();

    return content;
}

export const getPCA = async (notebookId: string) => {
    const url = buildUrl(API_URL, {
        path: `notebooks/${notebookId}/pca`,
    });

    const response = await fetch(url);
    const pca = await response.json();

    return pca;
}